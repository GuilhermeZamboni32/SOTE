import React from 'react';
import { createBrowserRouter } from "react-router-dom";
import Cadastro from "../pages/cadastro/Cadastro";
import Triagem from '../pages/triagem/Triagem';
import FilaAtendimento from '../pages/fila/FilaAtendimento'; 

const router = createBrowserRouter([
    { path: "/", element: <Cadastro /> },
    { path: "/cadastro", element: <Cadastro /> },
    { path: "/triagem", element: <Triagem /> },
    { path: "/fila", element: <FilaAtendimento /> }, 
]);

export default router;