import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import cerrarIcon from '../assets/cerrar.png';
import avatarIcon from '../assets/avatar.png';
import playIcon from '../assets/play.png';
import axios from 'axios';

const Perfil = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userData, setUserData] = useState(null);
    const [userPrompts, setUserPrompts] = useState([]);

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }

        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                // Obtener información del usuario
                const userResponse = await axios.get('http://localhost:5000/api/auth/profile', { headers });
                setUserData(userResponse.data);

                // Obtener prompts del usuario
                const promptsResponse = await axios.get('http://localhost:5000/api/prompts/user-prompts', { headers });
                setUserPrompts(promptsResponse.data);
            } catch (error) {
                console.error('Error al cargar los datos del perfil:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleProfile = () => {
        navigate('/perfil');
    };

    const handleRun = () => {
        navigate('/home');
    };

    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="w-full p-6 bg-white rounded-lg shadow-md">
                {/* SECCION INICIAL */}
                <div className="flex flex-row justify-between border-b border-b-gray-500 mb-5">
                    <h1 className="text-2xl font-bold m-2 pt-3 ">{username}</h1>
                    <div className="flex flex-row">
                        <button
                            onClick={handleRun}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-10 mb-2 py-2 px-4 rounded-xl"
                            title="play"
                        >
                            <img src={playIcon} alt="play" className="h-8 w-8" />
                        </button>
                        <button
                            onClick={handleProfile}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-10 mb-2 py-2 px-4 rounded-xl"
                            title="perfil"
                        >
                            <img src={avatarIcon} alt="perfil" className="h-8 w-8" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold mb-2 py-2 px-4 rounded-xl"
                            title="cerrar"
                        >
                            <img src={cerrarIcon} alt="cerrar" className="h-8 w-8" />
                        </button>
                    </div>
                </div>

                {/* INFORMACIÓN DEL USUARIO */}
                <h1 className="text-2xl border-b border-b-gray-500 pb-2 font-bold m-2 pt-3">Tokens y Respuestas</h1>

                {userData && (
                    <div className="border border-solid p-4 bg-gray-100 rounded-lg mt-5">
                        <p>Tokens de entrada: {userData.inputTokens || 0}</p>
                        <p>Tokens de salida: {userData.outputTokens || 0}</p>
                        <p>Respuestas procesadas: {userData.responsesProcessed || 0}</p>
                    </div>
                )}

                {/* PROMPTS DEL USUARIO */}
                <div className="mt-5">
                <h1 className="text-2xl border-b border-b-gray-500 pb-2 font-bold m-2 pt-3">Mis prompts</h1>
                        {userPrompts.length > 0 ? (
                            userPrompts.map((prompt, index) => (
                                <div key={prompt._id || index} className="border border-solid p-4 bg-gray-100 rounded-lg mt-5">
                                    <h2 className="text-xl font-bold mb-2 pb-1 border-b border-b-black w-fit">{prompt.evaluator_id}</h2>
                                    <p>{prompt.prompt}</p>
                                </div>
                            ))
                        ) : (
                            <p>No tienes prompts guardados.</p>
                        )}
                </div>
            </div>
        </div>
    );
};

export default Perfil;
