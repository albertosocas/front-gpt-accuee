import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import cerrarIcon from '../assets/cerrar.png';
import avatarIcon from '../assets/avatar.png';

const Perfil = () => {
    
    
    return (
        <div className=" flex items-center justify-center bg-gray-100">
          <div className="w-full p-6 bg-white rounded-lg shadow-md">
    
          { /* SECCION INICIAL */ }
            <div className='flex flex-row justify-between border-b border-b-gray-500 mb-5'>
              <h1 className="text-2xl font-bold m-2 pt-3 ">Evaluador Automático</h1>
              <div className='flex flex-row'>
                <button
                className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-10 mb-2 py-2 px-4 rounded-xl "
                title="perfil"
              >
                <img src={avatarIcon} alt="perfil" className="h-8 w-8" />
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-white font-bold mb-2 py-2 px-4 rounded-xl "
                title="cerrar"
              >
                <img src={cerrarIcon} alt="cerrar" className="h-8 w-8" />
              </button>
              </div>
              
            </div>
            </div>
        </div>
    );
};

export default Perfil;