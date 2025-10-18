// src/pages/fila-atendimento/FilaAtendimento.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FilaAtendimento.css';
import somAlerta from '../../assets/alerta.mp3';

function FilaAtendimento() {
  const [fila, setFila] = useState([]);
  const navigate = useNavigate();
  const audioPlayer = useRef(null);
  const [pacientesAlertados, setPacientesAlertados] = useState(new Set());

  const buscarFilaAtendimento = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/atendimentos/aguardando-atendimento');
      const novaFila = response.data;
      setFila(novaFila);
      verificarAlertas(novaFila);
    } catch (error) {
      console.error("Erro ao buscar fila de atendimento:", error);
    }
  };

  const playAlertaSonoro = () => {
    audioPlayer.current.play().catch(error => {
      console.log("A reprodução do som foi bloqueada pelo navegador.", error);
    });
  };

  const verificarAlertas = (filaParaVerificar) => {
    let alertaDisparado = false;
    const novosAlertados = new Set(pacientesAlertados);

    filaParaVerificar.forEach(paciente => {
      if (paciente.classificacao === 'Laranja') {
        const tempoEspera = calcularTempoEspera(paciente.hora_fim_triagem, true);
        if (tempoEspera >= 10 && !pacientesAlertados.has(paciente.id)) {
          alertaDisparado = true;
          novosAlertados.add(paciente.id);
        }
      }
    });

    if (alertaDisparado) {
      playAlertaSonoro();
      setPacientesAlertados(novosAlertados);
    }
  };

  useEffect(() => {
    buscarFilaAtendimento();
    const intervalId = setInterval(buscarFilaAtendimento, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const calcularTempoEspera = (hora, apenasNumero = false) => {
    const agora = new Date();
    const horaTriagem = new Date(hora);
    const diffMs = agora - horaTriagem;
    const diffMins = Math.floor(diffMs / 60000);
    return apenasNumero ? diffMins : `${diffMins} min`;
  };

  // ***** NOVA FUNÇÃO PARA CHAMAR O PACIENTE *****
  const handleChamarPaciente = async (pacienteId) => {
    try {
      // Faz a requisição para o backend para atualizar o status
      await axios.put(`http://localhost:3000/api/atendimentos/${pacienteId}/chamar`);

      // Atualiza a tela IMEDIATAMENTE, removendo o paciente da lista
      // Isso para o alerta visual, pois o card deixa de existir
      setFila(filaAtual => filaAtual.filter(p => p.id !== pacienteId));
      
      // Remove o paciente da lista de alertas sonoros para garantir
      setPacientesAlertados(alertadosAtuais => {
        const novosAlertados = new Set(alertadosAtuais);
        novosAlertados.delete(pacienteId);
        return novosAlertados;
      });

      alert('Paciente chamado para o consultório!');

    } catch (error) {
      console.error('Erro ao chamar paciente:', error);
      alert('Não foi possível chamar o paciente. Tente novamente.');
    }
  };

  return (
    <div className="fila-atendimento-container">
      <audio ref={audioPlayer} src={somAlerta} muted={false} />

      <button onClick={() => navigate(-1)} className="btn-voltar">
        &larr; Voltar para Triagem
      </button>

      <h1>Fila de Atendimento Médico</h1>
      <div className="painel-pacientes">
        {fila.length > 0 ? (
          fila.map(paciente => {
            const tempoEspera = calcularTempoEspera(paciente.hora_fim_triagem, true);
            const deveAlertar = paciente.classificacao === 'Laranja' && tempoEspera >= 10;
            
            return (
              <div key={paciente.id} className={`paciente-card ${paciente.classificacao.toLowerCase()} ${deveAlertar ? 'alerta-laranja' : ''}`}>
                <div className="card-header">
                  <span className="classificacao-tag">{paciente.classificacao}</span>
                  <span className="tempo-espera">{calcularTempoEspera(paciente.hora_fim_triagem)}</span>
                </div>
                <div className="card-body">
                  <p className="nome-paciente">{paciente.nome_completo}</p>
                </div>
                <div className="card-footer">
                  {/* O BOTÃO AGORA CHAMA A NOVA FUNÇÃO */}
                  <button className="btn-chamar" onClick={() => handleChamarPaciente(paciente.id)}>
                    Chamar Paciente
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="fila-vazia">Nenhum paciente aguardando atendimento.</p>
        )}
      </div>
    </div>
  );
}

export default FilaAtendimento;