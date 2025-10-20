import React, { useState } from 'react';
import axios from 'axios'; 
import './Cadastro.css'; 
import { useNavigate } from 'react-router-dom';

function Cadastro() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [nomeMae, setNomeMae] = useState('');
 
  const [queixaPrincipal, setQueixaPrincipal] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const pacienteData = {
      nome_completo: nomeCompleto,
      data_nascimento: dataNascimento,
      cpf: cpf,
      nome_mae: nomeMae,
      queixa_principal: queixaPrincipal,
    };

    try {
      const response = await axios.post('http://localhost:3000/api/pacientes', pacienteData);
      
      alert(`Paciente "${response.data.paciente.nome_completo}" cadastrado. Aguardando triagem.`);

      setNomeCompleto('');
      setDataNascimento('');
      setCpf('');
      setNomeMae('');
      setQueixaPrincipal('');

      navigate('/triagem');

    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Erro: ${error.response.data.error}`);
      } else {
        alert('Não foi possível cadastrar o paciente. Verifique o console.');
      }
    }
  };

  return (
    <div className="cadastro-container">
      <h1>Cadastro de Paciente</h1>
      <form onSubmit={handleSubmit} className="cadastro-form">
        <div className="form-group">
          <label htmlFor="nome">Nome Completo</label>
          <input
            type="text"
            id="nome"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="queixa">Queixa Principal</label>
          <textarea
            id="queixa"
            rows="3"
            value={queixaPrincipal}
            onChange={(e) => setQueixaPrincipal(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="dataNascimento">Data de Nascimento</label>
          <input
            type="date"
            id="dataNascimento"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cpf">CPF</label>
          <input
            type="text"
            id="cpf"
            placeholder="123.456.789-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="nomeMae">Nome da Mãe</label>
          <input
            type="text"
            id="nomeMae"
            value={nomeMae}
            onChange={(e) => setNomeMae(e.target.value)}
          />
        </div>
        <button type="submit" className="submit-button">Registrar e Enviar para Triagem</button>
      </form>
    </div>
  );
}

export default Cadastro;