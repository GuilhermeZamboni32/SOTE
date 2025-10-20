// src/pages/triagem/Triagem.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Triagem.css';
import { useNavigate } from 'react-router-dom';

const ModalTriagem = ({ atendimento, fecharModal, salvarClassificacao }) => {

  const [corSelecionada, setCorSelecionada] = useState(null);
  const cores = ['Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul'];

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Classificação de Risco (Pulseira)</h2>
        <h3>Paciente: {atendimento.nome_completo}</h3>
        <p><strong>Queixa:</strong> {atendimento.queixa_principal}</p>
        
        <div className="cores-container">
          {cores.map(cor => (
            <button
              key={cor}
              className={`btn-cor ${cor.toLowerCase()} ${corSelecionada === cor ? 'selecionada' : ''}`}
              onClick={() => setCorSelecionada(cor)}
            >
              {cor}
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
          <button
            className="btn-salvar"
            onClick={() => salvarClassificacao(corSelecionada)}
            disabled={!corSelecionada}
          >
            Salvar Classificação
          </button>
        </div>
      </div>
    </div>
  );
};

function Triagem() {
  const [fila, setFila] = useState([]);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const navigate = useNavigate();

  const buscarFila = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/atendimentos/aguardando-triagem');
      setFila(response.data);
    } catch (error) {
      console.error("Erro ao buscar fila de triagem:", error);
      alert('Não foi possível carregar a fila. Tente novamente.');
    }
  };

  useEffect(() => {
    buscarFila();
  }, []);

  const handleSalvarClassificacao = async (cor) => {
    try {
      await axios.post('http://localhost:3000/api/triagens', {
        atendimento_id: atendimentoSelecionado.id,
        classificacao: cor,
      });
      alert(`Paciente ${atendimentoSelecionado.nome_completo} classificado com a cor ${cor}!`);
      setAtendimentoSelecionado(null);
      buscarFila();
    } catch (error) {
      console.error("Erro ao salvar classificação:", error);
      alert('Não foi possível salvar a classificação.');
    }
  };

  return (
    <div className="fila-container">
      <div className="navegacao-header">
        <button onClick={() => navigate(-1)} className="btn-voltar">
          &larr; Voltar para Cadastro 
        </button>
        <button onClick={() => navigate('/fila')} className="btn-avancar">
          Ver Fila de Atendimento &rarr;
        </button>
      </div>

      <h1>Painel de Triagem</h1>
      <table className="fila-table">
        <thead>
          <tr>
            <th>Nome do Paciente</th>
            <th>Queixa Principal</th>
            <th>Hora da Chegada</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {fila.length > 0 ? (
            fila.map(atendimento => (
              <tr key={atendimento.id}>
                <td>{atendimento.nome_completo}</td>
                <td>{atendimento.queixa_principal}</td>
                <td>{new Date(atendimento.hora_chegada).toLocaleTimeString()}</td>
                <td>
                  <button className="btn-triar" onClick={() => setAtendimentoSelecionado(atendimento)}>
                    Classificar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Nenhum paciente aguardando triagem.</td>
            </tr>
          )}
        </tbody>
      </table>

      {atendimentoSelecionado && (
        <ModalTriagem
          atendimento={atendimentoSelecionado}
          fecharModal={() => setAtendimentoSelecionado(null)}
          salvarClassificacao={handleSalvarClassificacao}
        />
      )}
    </div>
  );
}

export default Triagem;