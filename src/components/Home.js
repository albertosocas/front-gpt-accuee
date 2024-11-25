import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import clearIcon from '../assets/escoba.png';
import anadirRespuesta from '../assets/anadir.png';
import loadingIcon from '../assets/loading.gif';
import cerrarIcon from '../assets/cerrar.png';
import avatarIcon from '../assets/avatar.png';




const Home = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [studentResponses, setStudentResponses] = useState([]);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [result, setResult] = useState('');
  const [stats, setStats] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState('');
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); // Asegúrate de guardar el token al iniciar sesión
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

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
        const token = localStorage.getItem('token'); // Obtén el token
        if (!token) {
            alert('No está autenticado. Inicie sesión para cargar sus prompts.');
            return;
        }

        try {
            const response = await axios.get('http://localhost:5000/api/prompts/user-prompts', {
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
        setSelectedPrompt('');
    };

    const handleSubmit = async () => {
        // Validación: Si alguno de los campos está vacío, mostramos un mensaje de error
        if (!prompt || selectedResponses.length === 0 || !evaluatorId) {
          setErrorMessage('Por favor, complete todos los campos: el prompt, las respuestas de los estudiantes y el ID del evaluador.');
          return;
        }
    
        setErrorMessage('');
        setIsLoading(true);
    
        try {
          const response = await axios.post('http://localhost:5000/evaluate', {
            prompt,
            studentResponses: selectedResponses,
            evaluator_id: evaluatorId,
            gpt_manager: gptManager,
            query_batch_length: queryBatchLength,
            temperature
          });
          setResult(response.data.result);
          setStats(response.data.stats);
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
      
        // Selecciona respuestas aleatoriamente
        const shuffledResponses = [...studentResponses].sort(() => 0.5 - Math.random());
        const selectedRandomResponses = shuffledResponses.slice(0, count);
      
        // Actualiza las respuestas seleccionadas con las seleccionadas aleatoriamente
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
      };

      const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
          const fileType = file.name.split('.').pop().toLowerCase();
      
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target.result;
      
            if (fileType === 'txt') {
              // Lógica para archivos .txt
              const lines = text.split('\n');
              const parsedResponses = lines.filter(line => line.trim() !== '');
              setStudentResponses(parsedResponses);
              setShowSelectColumn(false);
            } else if (fileType === 'csv') {
              // Lógica para archivos .csv
              const lines = text.split('\n');
              const parsedResponses = lines.map(line => line.split(separator)).filter(line => line.length > 0);
      
              // Asignar las columnas (primera fila)
              const headers = parsedResponses[0];
              setFileColumns(headers);  // Guardamos las columnas
              setStudentResponses(parsedResponses);  // Guardamos todos los datos
              setShowSelectColumn(true);
            }
          };
      
          if (fileType === 'txt' || fileType === 'csv') {
            reader.readAsText(file);
          } else if (fileType === 'xlsx') {
            // Lógica para archivos .xlsx
            reader.onload = (e) => {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
              // Asignar las columnas (primera fila)
              const headers = sheetData[0];
              setFileColumns(headers);  // Guardamos las columnas
              setStudentResponses(sheetData);  // Guardamos todos los datos
              setShowSelectColumn(true);
            };
            reader.readAsArrayBuffer(file);
          } else {
            setErrorMessage('Tipo de archivo no soportado. Por favor, cargue un archivo .txt, .csv o .xlsx');
          }
        }
      };

      const handleSavePrompt = async () => {
        // Validaciones
        const batchLength = parseInt(queryBatchLength, 10);
        if (!prompt || !evaluatorId || !gptManager || isNaN(batchLength)) {
            setErrorMessage('Por favor, complete todos los campos requeridos.');
            return;
        }
        setErrorMessage('');
    
        try {
            await axios.post(
                'http://localhost:5000/api/prompts',
                {
                    prompt,
                    evaluator_id: evaluatorId,
                    gpt_manager: gptManager,
                    query_batch_length: batchLength,
                    temperature,
                },
                { headers: getAuthHeaders() } // Añadir el token aquí
            );
            alert('Prompt guardado correctamente.');
        } catch (error) {
            console.error('Error al guardar el prompt:', error);
        }
    };
    

    const handleLoadSavedPrompt = async () => {
      try {
          const response = await axios.get('http://localhost:5000/api/prompts/user-prompts', {
              headers: getAuthHeaders(),
          });
          setSavedPrompts(response.data); // Asignar los prompts al estado
      } catch (error) {
          console.error('Error al cargar los prompts:', error);
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
        
          // Verificar si la respuesta ya existe
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
            const columnIndex = fileColumns.indexOf(selectedColumn);  // Buscar el índice de la columna seleccionada
            
            // Filtrar los datos de esa columna
            const columnData = studentResponses.map(row => row[columnIndex]).filter(value => value);
            
            setStudentResponses(columnData);  // Actualizamos las respuestas con la columna seleccionada
          };


          return (
            <div className=" flex items-center justify-center bg-gray-100">
              <div className="w-full p-6 bg-white rounded-lg shadow-md">
        
              { /* SECCION INICIAL */ }
                <div className='flex flex-row justify-between border-b border-b-gray-500 mb-5'>
                  <h1 className="text-2xl font-bold m-2 pt-3 ">Evaluador Automático</h1>
                  <div className='flex flex-row'>
                    <p className='text-2xl font-bold m-2 mr-5'>{username}</p>
                    <button
                    onClick={handleProfile}
                    className="bg-gray-300 hover:bg-gray-400 text-white font-bold mr-10 mb-2 py-2 px-4 rounded-xl "
                    title="perfil"
                  >
                    <img src={avatarIcon} alt="perfil" className="h-8 w-8" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-300 hover:bg-gray-400 text-white font-bold mb-2 py-2 px-4 rounded-xl "
                    title="cerrar"
                  >
                    <img src={cerrarIcon} alt="cerrar" className="h-8 w-8" />
                  </button>
                  </div>
                  
                </div>
        
                { /* SECCION PROMPT */ }
                <div className='border border-solid p-4 bg-gray-100 rounded-lg'>
                  <label htmlFor="savedPrompts" className="block ml-1 mb-2 border-b border-b-gray-500">Seleccione un prompt guardado</label>
                  <select
                      id="savedPrompts"
                      value={selectedPrompt}
                      onChange={handleLoadSavedPrompt}
                      className="border border-gray-300 rounded-lg px-4 py-2 mb-4 w-full"
                  >
                      <option value="">Seleccione un prompt</option>
                      {savedPrompts.map((savedPrompt, index) => (
                          <option key={index} value={savedPrompt.evaluator_id}>
                              {savedPrompt.evaluator_id}
                          </option>
                      ))}
                  </select>
                  <div className='flex flex-row'>
                    <div className='w-[70%]'>
                      <label htmlFor="prompt" className="block ml-1 mb-2 border-b border-b-gray-500">Ingrese el prompt</label>
                      <textarea
                        id="prompt"
                        value={prompt}
                        onChange={handlePromptChange}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full h-96 mb-4 resize-none"
                        rows="4"
                      ></textarea>
                    </div>
                    <div className='flex flex-col w-[30%] ml-4 justify-between'>
                      <p className="block mb-2 ml-1 border-b border-b-gray-500">Parámetros</p>
                      <label htmlFor="evaluatorId" className="block px-5">ID del Evaluador:</label>
                      <input
                        type="text"
                        id="evaluatorId"
                        value={evaluatorId}
                        onChange={(e) => setEvaluatorId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 mx-5 mb-2"
                      />
                      <label htmlFor="gptManager" className="block px-5">Selecciona el GPT Manager:</label>
                      <select
                        id="gptManager"
                        value={gptManager}
                        onChange={(e) => setGptManager(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 mx-5 mb-3"
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
                          className="border border-gray-300 rounded-lg h-10 w-20 ml-3 p-1"
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
                      <div className=' rounded mb-5 flex flex-row justify-between '>
                      <button
                        onClick={handleClear}
                        className="bg-gray-300 hover:bg-gray-400 text-white font-bold ml-2 py-2 px-4 rounded-xl "
                        title="Clean"
                      >
                        <img src={clearIcon} alt="Limpiar" className="h-10 w-10" />
                      </button>
                      <button
                      onClick={handleSavePrompt}
                      className="bg-gray-400 hover:bg-gray-500  text-white font-bold w-[70%] py-2 px-2 rounded-xl "
                      >
                        Guardar Prompt
                      </button>
                      </div>
                    </div>
                  </div>
                </div>  
                  
                { /* SECCION RESPUESTAS */ }
                <div className='mt-5 border border-solid p-4 bg-gray-100 rounded-lg'>
                  <div className='flex flex-row'>
                    <div className='flex flex-col w-[70%] '>
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
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-2 rounded"
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
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelAddResponse}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                      )}
                    </div>
                    <div className='flex flex-col w-[30%] ml-4'>
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
                          className="border border-gray-300 rounded-lg px-4 py-2 w-20"
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
                          className="border border-gray-300 rounded-lg p-2 mr-5 w-20"
                        />
                        <button
                          onClick={handleRandomSelect}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                        >
                          Seleccionar al azar
                        </button>
                      </div>
                      <button
                          onClick={handleSubmit}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 mt-2 rounded-lg"
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