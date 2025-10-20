// backend/serverPacientes.js

const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json());

// =================================================================
// ROTA DE CADASTRO (H01)
// =================================================================
app.post('/api/pacientes', async (req, res) => {
    const { nome_completo, data_nascimento, cpf, nome_mae, queixa_principal } = req.body;

    if (!nome_completo || !queixa_principal) {
        return res.status(400).json({ error: 'Nome completo e queixa principal são obrigatórios.' });
    }

    try {
        let paciente;
        const pacienteExistente = await db.query('SELECT * FROM pacientes WHERE cpf = $1', [cpf]);

        if (pacienteExistente.rows.length > 0) {
            paciente = pacienteExistente.rows[0];
        } else {
            const novoPaciente = await db.query(
                'INSERT INTO pacientes (nome_completo, data_nascimento, cpf, nome_mae) VALUES ($1, $2, $3, $4) RETURNING *',
                [nome_completo, data_nascimento || null, cpf || null, nome_mae || null]
            );
            paciente = novoPaciente.rows[0];
        }

        const novoAtendimento = await db.query(
            'INSERT INTO atendimentos (paciente_id, queixa_principal, status, hora_chegada) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [paciente.id, queixa_principal, 'Aguardando Triagem']
        );

        res.status(201).json({ paciente, atendimento: novoAtendimento.rows[0] });

    } catch (error) {
        console.error('Erro ao registrar atendimento:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'CPF já cadastrado, mas ocorreu um erro ao criar o atendimento.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// =================================================================
// ROTAS DA TELA DE TRIAGEM (H02)
// =================================================================
app.get('/api/atendimentos/aguardando-triagem', async (req, res) => {
  try {
    const query = `
      SELECT
        atendimentos.id,
        pacientes.nome_completo,
        atendimentos.queixa_principal,
        atendimentos.hora_chegada
      FROM atendimentos
      JOIN pacientes ON atendimentos.paciente_id = pacientes.id
      WHERE atendimentos.status = 'Aguardando Triagem'
      ORDER BY atendimentos.hora_chegada ASC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar fila de triagem:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/api/triagens', async (req, res) => {
  const { atendimento_id, classificacao } = req.body;

  if (!atendimento_id || !classificacao) {
    return res.status(400).json({ error: 'ID do atendimento e classificação são obrigatórios.' });
  }

  try {
    const updateAtendimentoQuery = `
      UPDATE atendimentos
      SET
        classificacao = $1,
        status = 'Aguardando Atendimento',
        hora_fim_triagem = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await db.query(updateAtendimentoQuery, [classificacao, atendimento_id]);
    res.status(200).json({ message: 'Paciente classificado com sucesso!', atendimento: rows[0] });
  } catch (error) {
    console.error('Erro ao salvar triagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// =================================================================
// ROTA DA FILA DE ATENDIMENTO / DASHBOARD DO MÉDICO (H03)
// =================================================================
app.get('/api/atendimentos/aguardando-atendimento', async (req, res) => {
  try {
    const query = `
      SELECT
        atendimentos.id,
        pacientes.nome_completo,
        atendimentos.classificacao,
        atendimentos.hora_fim_triagem,
        atendimentos.queixa_principal
      FROM atendimentos
      JOIN pacientes ON atendimentos.paciente_id = pacientes.id
      WHERE atendimentos.status = 'Aguardando Atendimento'
      ORDER BY
        CASE atendimentos.classificacao
          WHEN 'Vermelho' THEN 1
          WHEN 'Laranja'  THEN 2
          WHEN 'Amarelo'  THEN 3
          WHEN 'Verde'    THEN 4
          WHEN 'Azul'     THEN 5
        END,
        atendimentos.hora_fim_triagem ASC;
    `;
    const { rows } = await db.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar fila de atendimento médico:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ROTA PARA O MÉDICO CHAMAR O PACIENTE (H06 - Início)
app.put('/api/atendimentos/:id/chamar', async (req, res) => {
  const { id } = req.params; 

  try {
    const updateQuery = `
      UPDATE atendimentos
      SET
        status = 'Em Atendimento',
        hora_inicio_atendimento_medico = NOW()
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await db.query(updateQuery, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Atendimento não encontrado.' });
    }

    res.status(200).json({ message: 'Paciente em atendimento!', atendimento: rows[0] });
  } catch (error) {
    console.error('Erro ao chamar paciente:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// =================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =================================================================
app.listen(PORT, () => {
  console.log(`Servidor do SOTE rodando na porta ${PORT}`);
});