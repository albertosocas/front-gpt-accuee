import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import cerrarIcon from '../assets/cerrar.png';
import avatarIcon from '../assets/avatar.png';
import playIcon from '../assets/play.png';
import axios from 'axios';
import config from '../config';

const Perfil = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userData, setUserData] = useState(null);
    const [userPrompts, setUserPrompts] = useState([]);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [expandedPrompt, setExpandedPrompt] = useState(null);
    const apiUrl = `${config.server}`;
    const [updatedPrompt, setUpdatedPrompt] = useState({
        prompt: '',
        evaluator_id: '',
        gpt_manager: '',
        query_batch_length: '',
        temperature: '',
        description:''
    });

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }

        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const userResponse = await axios.get(`http://${apiUrl}:5000/api/auth/profile`, { headers });
                setUserData(userResponse.data);

                const promptsResponse = await axios.get(`http://${apiUrl}:5000/api/prompts/user-prompts`, { headers });
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

    const deletePrompt = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await axios.delete(`http://${apiUrl}:5000/api/prompts/delete/${id}`, { headers });

            setUserPrompts((prevPrompts) => prevPrompts.filter((prompt) => prompt._id !== id));

            console.log('Prompt eliminado correctamente.');
        } catch (error) {
            console.error('Error al eliminar el prompt:', error);
        }
    };

    const handleEditPrompt = (prompt) => {
        setEditingPrompt(prompt._id);
        setUpdatedPrompt(prompt);
    };

    const handleUpdatePrompt = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
            const response = await axios.put(`http://${apiUrl}:5000/api/prompts/edit/${editingPrompt}`, updatedPrompt, {
                headers,
            });

            setEditingPrompt(null); 
            const promptsResponse = await axios.get(`http://${apiUrl}:5000/api/prompts/user-prompts`, { headers });
            setUserPrompts(promptsResponse.data);
        } catch (error) {
            console.error('Error al actualizar el prompt:', error);
        }
    };

    return (
        <div className="flex items-center justify-center bg-gray-100">
            <div className="w-full p-6 bg-white rounded-lg shadow-md">
                {/* SECCION INICIAL */}
                <div className="flex flex-row justify-between border-b border-b-gray-500 lg:mb-5">
                    <h1 className="text-2xl font-bold m-2 pt-3 ">{username}</h1>
                    <div className="flex flex-row lg:w-[30%] lg:justify-between">
                        <button
                            onClick={handleRun}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-5 mb-2 py-2 px-4 rounded-xl"
                            title="play"
                        >
                            <img src={playIcon} alt="play" className="h-8 w-8" />
                        </button>
                        <button
                            onClick={handleProfile}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-5 mb-2 py-2 px-4 rounded-xl"
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
                                    {editingPrompt === prompt._id ? (
                                        <div>
                                            <h2 className="text-xl font-bold mb-2">Editando Prompt</h2>
                                            <label className="block mb-2">Nombre del prompt:</label>
                                            <input
                                                type="text"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={updatedPrompt.evaluator_id}
                                                onChange={(e) =>
                                                    setUpdatedPrompt({ ...updatedPrompt, evaluator_id: e.target.value })
                                                }
                                            />
                                            <label className="block mb-2">Prompt</label>
                                            <textarea
                                                className="w-full mb-4 p-2 border rounded"
                                                value={updatedPrompt.prompt}
                                                onChange={(e) => setUpdatedPrompt({ ...updatedPrompt, prompt: e.target.value })}
                                                placeholder="Prompt"
                                                rows="15"
                                                style={{ resize: 'vertical' }} 
                                            />
                                            <label className="block mb-2">Descripción</label>
                                            <textarea
                                                className="w-full mb-4 p-2 border rounded"
                                                value={updatedPrompt.description}
                                                onChange={(e) => setUpdatedPrompt({ ...updatedPrompt, description: e.target.value })}
                                                placeholder="Escriba una descripción del prompt . . ."
                                                rows="3"
                                                style={{ resize: 'vertical' }}
                                            />
                                            <label htmlFor="gptManager" className="block mb-2">Selecciona el modelo de GPT:</label>
                                            <select
                                                id="gptManager"
                                                value={updatedPrompt.gpt_manager}
                                                onChange={(e) =>
                                                    setUpdatedPrompt({ ...updatedPrompt, gpt_manager: e.target.value }) 
                                                }
                                                className="w-full mb-2 p-2 border rounded"
                                            >
                                                <option value="gpt-4">GPT-4</option>
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
                                            </select>
                                            <label className="block mb-2">Batch Length:</label>
                                            <input
                                                type="number"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={updatedPrompt.query_batch_length}
                                                onChange={(e) =>
                                                    setUpdatedPrompt({ ...updatedPrompt, query_batch_length: e.target.value })
                                                }
                                            />
                                            <label className="block mb-2">Temperatura:</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="1"
                                                className="w-full mb-2 p-2 border rounded"
                                                value={updatedPrompt.temperature}
                                                onChange={(e) =>
                                                    setUpdatedPrompt({ ...updatedPrompt, temperature: parseFloat(e.target.value) })
                                                }
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={handleUpdatePrompt}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl mt-2 mr-5"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => setEditingPrompt(null)}
                                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl mt-2 mr-5"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-bold mb-2 pb-1 border-b border-b-black w-fit">
                                                {prompt.evaluator_id}
                                            </h2>

                                            {/* Descripción */}
                                            <p className="text-gray-600 mb-2">{prompt.description}</p>

                                            {/* Prompt truncado con "Leer más" */}
                                            <div className="relative">
                                                <p className="whitespace-pre-line">
                                                    {expandedPrompt === prompt._id ? (
                                                        <>
                                                            {prompt.prompt}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {prompt.prompt.split('\n').slice(0, 5).join('\n')}
                                                            {prompt.prompt.split('\n').length > 5 && '...'}
                                                        </>
                                                    )}
                                                </p>
                                                {prompt.prompt.split('\n').length > 5 && (
                                                    <span
                                                        className="text-blue-500 cursor-pointer mt-2 inline-block"
                                                        onClick={() =>
                                                            setExpandedPrompt(
                                                                expandedPrompt === prompt._id ? null : prompt._id
                                                            )
                                                        }
                                                    >
                                                        {expandedPrompt === prompt._id ? 'Leer menos' : 'Leer más'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Botones de edición y eliminación */}
                                            <div className="flex justify-end mr-3">
                                                <button
                                                    onClick={() => handleEditPrompt(prompt)}
                                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl mt-2 mr-5"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => deletePrompt(prompt._id)}
                                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-4 rounded-xl mt-2"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </>
                                    )}
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
