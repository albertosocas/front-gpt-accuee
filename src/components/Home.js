import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import clearIcon from '../assets/escoba.png';
import anadirRespuesta from '../assets/anadir.png';
import loadingIcon from '../assets/loading.gif';
import cerrarIcon from '../assets/cerrar.png';
import avatarIcon from '../assets/avatar.png';
import checkIcon from '../assets/check.png';




const Home = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [studentResponses, setStudentResponses] = useState([]);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [result, setResult] = useState('');
  const [stats, setStats] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [setSelectedPrompt] = useState('');
  const [queryBatchLength, setQueryBatchLength] = useState(20);
  const [evaluatorId, setEvaluatorId] = useState('');
  const [gptManager, setGptManager] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.2);
  const [randomSelectCount, setRandomSelectCount] = useState(0);
  const [isAddingResponse, setIsAddingResponse] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [separator, setSeparator] = useState(',');
  const [fileColumns, setFileColumns] = useState([]);
  const [selectedColumn] = useState('');
  const [showSelectColumn, setShowSelectColumn] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    handleLoadSavedPrompt();
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
        setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login'); 
    }
  }, [navigate]);

  useEffect(() => {
    const fetchPrompts = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No está autenticado. Inicie sesión para cargar sus prompts.');
            return;
        }

        try {
            const response = await axios.get('http://10.22.143.52:5000/api/prompts/user-prompts', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSavedPrompts(response.data); 
        } catch (error) {
            console.error('Error al cargar los prompts:', error);
        }
    };

    fetchPrompts();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('username');
    navigate('/login'); 
  };

  const handleProfile = () => {
    navigate('/perfil');
  };

  const handlePromptChange = (event) => {
        setPrompt(event.target.value);
  };

  const updateStats = async (stats, responsesProcessed) => {
    try {
        console.log('Valores para actualizar estadísticas:', {
            inputTokens: stats.input_tokens,
            outputTokens: stats.output_tokens,
            responsesProcessed: responsesProcessed
        });

        await axios.post('http://10.22.143.52:5000/api/auth/actualizar', {
            inputTokens: stats.input_tokens,
            outputTokens: stats.output_tokens,
            responsesProcessed: responsesProcessed
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log('Estadísticas actualizadas correctamente');
    } catch (error) {
        console.error('Error al actualizar las estadísticas:', error);
    }
};

  const handleSubmit = async () => {
        if (!prompt || selectedResponses.length === 0 || !evaluatorId) {
          setErrorMessage('Por favor, complete todos los campos: el prompt, las respuestas de los estudiantes y el ID del evaluador.');
          return;
        }
    
        setErrorMessage('');
        setIsLoading(true);
    
        try {
          const response = await axios.post('http://10.22.143.52:4000/evaluate', {
            prompt,
            studentResponses: selectedResponses,
            evaluator_id: evaluatorId,
            gpt_manager: gptManager,
            query_batch_length: queryBatchLength,
            temperature
          });
          
          const stats = response.data.stats;
          const responsesProcessed = selectedResponses.length;

          setResult(response.data.result);
          setStats(stats);
          await updateStats(stats, responsesProcessed);

        } catch (error) {
          console.error('Error al obtener los resultados:', error);
        } finally {
          setIsLoading(false);
        }
  };

  const handleCheckboxChange = (response) => {
        if (selectedResponses.includes(response)) {
          setSelectedResponses(selectedResponses.filter(item => item !== response)); 
        } else {
          setSelectedResponses([...selectedResponses, response]); 
        }
  };
    
  const handleSelectAll = (event) => {
        if (event.target.checked) {
          setSelectedResponses(studentResponses);
        } else {
          setSelectedResponses([]);
        }
  };
    
  const handleRandomSelect = () => {
        const count = parseInt(randomSelectCount, 10);
        
        if (count > studentResponses.length) {
          alert(`El número ingresado excede el número de respuestas disponibles (${studentResponses.length}).`);
          return;
        }
      
        const shuffledResponses = [...studentResponses].sort(() => 0.5 - Math.random());
        const selectedRandomResponses = shuffledResponses.slice(0, count);
      
        setSelectedResponses(selectedRandomResponses);
  };
    
  const handleDownload = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultado.txt';
        a.click();
        URL.revokeObjectURL(url);
  };
    
  const handleClear = () => {
    setPrompt(''); 
    setEvaluatorId('');
    setStudentResponses('');
    setResult('');
    setShowSelectColumn(false);
    setSelectedEvaluatorId('')
  };

  const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
          const fileType = file.name.split('.').pop().toLowerCase();
      
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target.result;
      
            if (fileType === 'txt') {
              
              const lines = text.split('\n');
              const parsedResponses = lines.filter(line => line.trim() !== '');
              setStudentResponses(parsedResponses);
              setShowSelectColumn(false);
            } else if (fileType === 'csv') {
              
              const lines = text.split('\n');
              const parsedResponses = lines.map(line => line.split(separator)).filter(line => line.length > 0);
      
              const headers = parsedResponses[0];
              setFileColumns(headers);  
              setStudentResponses(parsedResponses);  
              setShowSelectColumn(true);
            }
          };
      
          if (fileType === 'txt' || fileType === 'csv') {
            reader.readAsText(file);
          } else if (fileType === 'xlsx') {

            reader.onload = (e) => {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
              const headers = sheetData[0];
              setFileColumns(headers);
              setStudentResponses(sheetData);
              setShowSelectColumn(true);
            };
            reader.readAsArrayBuffer(file);
          } else {
            setErrorMessage('Tipo de archivo no soportado. Por favor, cargue un archivo .txt, .csv o .xlsx');
          }
        }
  };

  const handleSavePrompt = async () => {
        const batchLength = parseInt(queryBatchLength, 10);
        if (!prompt || !evaluatorId || !gptManager || isNaN(batchLength)) {
            setErrorMessage('Por favor, complete todos los campos requeridos.');
            return;
        }
        setErrorMessage('');
        setIsSaving(true);
    
        try {
            await axios.post(
                'http://10.22.143.52:5000/api/prompts',
                {
                    prompt,
                    evaluator_id: evaluatorId,
                    gpt_manager: gptManager,
                    query_batch_length: batchLength,
                    temperature,
                },
                { headers: getAuthHeaders() }
            );
            setIsSaving(false); 
            setIsSaved(true); 
            setTimeout(() => {
              setIsSaved(false);
            }, 3000);
        } catch (error) {
            console.error('Error al guardar el prompt:', error);
            setIsSaving(false);
        }
  };
    
  const handleLoadSavedPrompt = async () => {
    try {
        const response = await axios.get('http://10.22.143.52:5000/api/prompts/user-prompts', {
            headers: getAuthHeaders(),
        });
        setSavedPrompts(response.data);
    } catch (error) {
        console.error('Error al cargar los prompts:', error);
    }
  };

const handleSelectPrompt = (event) => {
  const evaluatorId = event.target.value;
  setSelectedEvaluatorId(evaluatorId);

  const selectedPromptData = savedPrompts.find((prompt) => prompt.evaluator_id === evaluatorId);

  if (selectedPromptData) {
      setPrompt(selectedPromptData.prompt);
      setEvaluatorId(selectedPromptData.evaluator_id);
      setGptManager(selectedPromptData.gpt_manager);
      setQueryBatchLength(selectedPromptData.query_batch_length);
      setTemperature(selectedPromptData.temperature || 0.5);
  }
};
  
  const handleAddResponseClick = () => {
          setIsAddingResponse(true);
  };
        
  const handleCancelAddResponse = () => {
          setIsAddingResponse(false);
          setNewResponse('');
  };
        
  const handleSaveNewResponse = () => {
          const trimmedResponse = newResponse.trim();
          if (trimmedResponse === '') {
            alert('La respuesta no puede estar vacía.');
            return;
          }
        
          if (studentResponses.includes(trimmedResponse)) {
            alert('Esta respuesta ya ha sido añadida.');
            return;
          }
        
          setStudentResponses([...studentResponses, trimmedResponse]);
          setSelectedResponses([...selectedResponses, trimmedResponse]);
          setNewResponse('');
          setIsAddingResponse(false);
  };

  const handleColumnSelection = (e) => {
            const selectedColumn = e.target.value;
            const columnIndex = fileColumns.indexOf(selectedColumn); 
            
            const columnData = studentResponses.map(row => row[columnIndex]).filter(value => value);
            
            setStudentResponses(columnData); 
  };

          return (
            <div className=" flex items-center justify-center bg-gray-100">
              <div className="w-full p-6 bg-white rounded-lg shadow-md">
        
              { /* SECCION INICIAL */ }
                <div className='border-b border-b-gray-500 mb-5 xs:flex flex-col lg:flex lg:flex-row lg:justify-between '>
                  <h1 className="text-2xl font-bold m-2 pt-3 ">Evaluador Automático</h1>
                  <div className=' flex flex-row lg:w-[30%] justify-between'>
                    <p className='text-2xl font-bold m-2 '>{username}</p>
                    <div className='flex flex-row sm:w-[35%] md:w-[50%] sm:justify-end lg:justify-between'>
                      <button
                      onClick={handleProfile}
                      className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-5 mb-2 py-2 px-4 rounded-xl "
                      title="perfil"
                      >
                      <img src={avatarIcon} alt="perfil" className="h-8 w-8" />
                      </button>
                      <button
                      onClick={handleLogout}
                      className="bg-gray-300 hover:bg-gray-400 text-white font-bold mb-2 py-2 px-4 rounded-xl  "
                      title="cerrar"
                      >
                      <img src={cerrarIcon} alt="cerrar" className="h-8 w-8" />
                      </button>
                    </div>
                  </div>
                </div>
        
                { /* SECCION PROMPT */ }
                <div className='border border-solid p-4 bg-gray-100 rounded-lg'>
                  <label htmlFor="savedPrompts" className="block ml-1 mb-2 border-b border-b-gray-500">Seleccione un prompt guardado</label>
                  <select
                      id="savedPrompts"
                      value={selectedEvaluatorId}
                      onChange={handleSelectPrompt}
                      className="border border-gray-300 rounded-lg px-4 py-2 mb-4 w-full"
                  >
                      <option value="">Seleccione un prompt</option>
                      {savedPrompts.map((savedPrompt, index) => (
                          <option key={index} value={savedPrompt.evaluator_id}>
                              {savedPrompt.evaluator_id}
                          </option>
                      ))}
                  </select>
                  <div className='sm:flex sm:flex-col lg:flex lg:flex-row'>
                    <div className='lg:w-[70%]'>
                      <label htmlFor="prompt" className="block ml-1 mb-2 border-b border-b-gray-500">Ingrese el prompt</label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={handlePromptChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full h-96 mb-4 resize-none"
                        rows="4"
                      ></textarea>
                    </div>
                    <div className='flex flex-col lg:w-[30%] lg:ml-4 justify-between'>
                      <p className="block mb-2 ml-1 border-b border-b-gray-500">Parámetros</p>
                      <label htmlFor="evaluatorId" className="block px-5">ID del Evaluador:</label>
                      <input
                        type="text"
                        id="evaluatorId"
                        value={evaluatorId}
                        onChange={(e) => setEvaluatorId(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 mx-5 mb-2"
                      />
                      <label htmlFor="gptManager" className="block px-5">Selecciona el GPT Manager:</label>
                      <select
                        id="gptManager"
                        value={gptManager}
                        onChange={(e) => setGptManager(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 mx-5 mb-3"
                      >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
                      </select>
                      <div className='flex flex-row items-center w-full mb-2 px-5 '>
                        <label htmlFor="queryBatchLength" >Batch Length:</label>
                        <input
                          type="number"
                          id="queryBatchLength"
                          value={queryBatchLength}
                          onChange={(e) => setQueryBatchLength(e.target.value)}
                          className="border border-gray-300 rounded-xl h-10 w-20 ml-3 p-1"
                        />
                      </div>
                      <label htmlFor="temperature" className="block px-5">Temperatura: {temperature} </label>
                      <input
                          type="range"
                          id="temperature"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="border border-gray-300 rounded-lg mx-5 mb-4"
                      />
                      <div className='rounded mb-5 flex flex-row justify-between '>
                      <button
                        onClick={handleClear}
                        className="bg-gray-300 hover:bg-gray-400 text-white font-bold ml-2 py-2 px-4 rounded-xl "
                        title="Clean"
                      >
                        <img src={clearIcon} alt="Limpiar" className="h-10 w-10" />
                      </button>
                      <button
                        onClick={handleSavePrompt}
                        className={`flex items-center justify-center bg-gray-400 hover:bg-gray-500 text-white font-bold w-[70%] py-2 px-2 mr-2 rounded-xl ${isSaving || isSaved ? 'cursor-not-allowed' : ''}`} disabled={isSaving || isSaved}
                      >
                        {isSaved ? (
                          <img src={checkIcon} alt="Guardado" className="h-10 w-10" />
                        ) : (
                          'Guardar Prompt'
                        )}
                      </button>
                      </div>
                    </div>
                  </div>
                </div>  
                  
                { /* SECCION RESPUESTAS */ }
                <div className='mt-5 border border-solid p-4 bg-gray-100 rounded-lg'>
                  <div className='sm:flex sm:flex-col lg:flex lg:flex-row'>
                    <div className='flex flex-col lg:w-[70%] '>
                      <label htmlFor="studentResponses" className="block mb-2 border-b border-b-gray-500">Respuestas de los estudiantes</label>
                      <div>
                        {studentResponses.length > 0 && (
                          <div className='max-h-96 overflow-y-auto'>
                            {studentResponses.map((response, index) => (
                              <div key={index} className="flex p-3 mb-4 rounded-lg ">
                                <input
                                  type="checkbox"
                                  id={`response-${index}`}
                                  checked={selectedResponses.includes(response)}
                                  onChange={() => handleCheckboxChange(response)}
                                  className="mr-4"
                                />
                                <label className='p-3 rounded-lg border border-solid border-gray-500 bg-white' htmlFor={`response-${index}`}>{response}</label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
        
                      {/* AÑADIR RESPUESTA */}
                      <div className="mb-4 mt-2">
                        <button
                          onClick={handleAddResponseClick}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-2 rounded-xl"
                        >
                          <img src={anadirRespuesta} alt="anadir" className="h-7 w-7" />
                        </button>
                      </div>
        
                      {isAddingResponse && (
                      <div className="mb-4">
                        <input
                          type="text"
                          value={newResponse}
                          onChange={(e) => setNewResponse(e.target.value)}
                          placeholder="Escribe la nueva respuesta"
                          className="border border-gray-300 rounded-lg px-4 py-2 w-full mb-2"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveNewResponse}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-xl"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelAddResponse}
                            className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded-xl"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                    <div className='flex flex-col lg:w-[30%] lg:ml-4'>
                      <label htmlFor="fileUpload" className="block mb-2">Cargar respuestas desde archivo (.txt, .csv, .xlsx):</label>
                      <input
                        id="fileUpload"
                        type="file"
                        accept=".txt,.csv,.xlsx"
                        onChange={handleFileUpload}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full mb-4"
                      />
                      <div className="mb-4">
                        <label htmlFor="separator" className="block mb-2">Indique el separador de campos (por defecto: ","):</label>
                        <input
                          type="text"
                          id="separator"
                          value={separator}
                          onChange={(e) => setSeparator(e.target.value)}
                          placeholder=","
                          className="border border-gray-300 rounded-xl px-4 py-2 w-20"
                        />
                      </div>
        
                      {showSelectColumn && (
                        <div className="mb-4">
                          <label htmlFor="columnSelect" className="block mb-2">Seleccione la columna de respuestas:</label>
                          <select
                            id="columnSelect"
                            value={selectedColumn}
                            onChange={handleColumnSelection}
                            className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                          >
                            {fileColumns.map((col, index) => (
                              <option key={index} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex items-center mb-4">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={selectedResponses.length === studentResponses.length} 
                          onChange={handleSelectAll} 
                          className="mr-2"
                        />
                        <label htmlFor="selectAll">Seleccionar todas las respuestas</label>
                      </div>
                      <div className="flex items-center mb-4">
                        <input
                          type="number"
                          id="randomSelectCount"
                          value={randomSelectCount}
                          onChange={(e) => setRandomSelectCount(e.target.value)}
                          placeholder="Cantidad de respuestas a seleccionar"
                          className="border border-gray-300 rounded-xl p-2 mr-5 w-20"
                        />
                        <button
                          onClick={handleRandomSelect}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl"
                        >
                          Seleccionar al azar
                        </button>
                      </div>
                      <button
                          onClick={handleSubmit}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 mt-2 rounded-xl"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <img src={loadingIcon} alt="Cargando..." className="h-7 w-7 inline-block" />
                          ) : (
                            'Evaluar con IA'
                          )}
                        </button>
                    </div>
                  </div>
        
                  {errorMessage && (
                    <div className="text-red-500 mb-4">
                      {errorMessage}
                    </div>
                  )}
                </div>
                
                { /* EVALUACION */ }
        
                {result && (
                  <div className="flex flex-col bg-gray-100 p-6 rounded-lg shadow-md mt-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Resultado:</h2>
        
                    {/* Sección de Evaluación GPT */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Evaluación GPT:</h3>
                      {Object.entries(result["evaluación GPT"]).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-semibold">{`Respuesta ${key}: `}</span>
                          {value}
                        </div>
                      ))}
                    </div>
        
                    {/* Sección de Respuestas */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Respuestas:</h3>
                      {Object.entries(result.response).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-semibold">{`Respuesta ${key}: `}</span>
                          {value}
                        </div>
                      ))}
                    </div>
        
                    {/* Sección de Respuesta Completa GPT */}
                    <div className="bg-white p-4 rounded-lg shadow-md">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Respuesta Completa GPT:</h3>
                      {Object.entries(result["respuesta completa GPT"]).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-semibold">{`Respuesta ${key}: `}</span>
                          {value}
                        </div>
                      ))}
                    </div>
                    <h2>Estadísticas de Uso:</h2>
                    {stats && (
                    <div>
                      <p><strong>Input Tokens:</strong> {stats.input_tokens}</p>
                      <p><strong>Output Tokens:</strong> {stats.output_tokens}</p>
                      <p><strong>Elapsed Time:</strong> {stats.elapsed_time} segundos</p>
                      <p><strong>Número de Respuestas Procesadas:</strong> {Object.keys(result.response).length}</p>
                    </div>
                    )}
                    <button 
                    onClick={handleDownload}
                    className=" bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 mt-6 rounded "
                    >
                      Descargar Resultado
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
};

export default Home;