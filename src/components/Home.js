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
import okIcon from '../assets/ok.png';
import alertaIcon from '../assets/alerta.png';
import errorIcon from '../assets/error.png';
import config from '../config';





const Home = () => {
  const navigate = useNavigate();
  const apiUrl = `${config.server}`;
  
  /*PROMPTS*/
  const [prompt, setPrompt] = useState('');
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [setSelectedPrompt] = useState('');
  const [queryBatchLength, setQueryBatchLength] = useState(20);
  const [evaluatorId, setEvaluatorId] = useState('');
  const [gptManager, setGptManager] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.2);
  const [isPromptLoaded, setIsPromptLoaded] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalysisVisible, setIsAnalysisVisible] = useState(false);
  const [description, setDescription] = useState('');

  /*RESPONSES*/
  const [studentResponses, setStudentResponses] = useState([]);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [randomSelectCount, setRandomSelectCount] = useState(0);
  const [newResponse, setNewResponse] = useState('');
  const [separator, setSeparator] = useState(',');
  const [fileColumns, setFileColumns] = useState([]);
  const [showSelectColumn, setShowSelectColumn] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [isAddingResponse, setIsAddingResponse] = useState(false);


  /* RESULTS */
  const [result, setResult] = useState('');
  const [stats, setStats] = useState('');
  
  /* MESSAGES */
  const [errorMessage, setErrorMessage] = useState('');
  const [errorMessagePrompt, setErrorMessagePrompt] = useState('');
  const [errorMessageEvaluatePrompt, setErrorMessageEvaluatePrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvaluate, setIsLoadingEvaluate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  
  const [username, setUsername] = useState('');
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState('');
  const [randomlySelectedCount, setRandomlySelectedCount] = useState(0);
  

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /*USE EFFECT*/
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
            const response = await axios.get(`http://${apiUrl}:5000/api/prompts/user-prompts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSavedPrompts(response.data); 
        } catch (error) {
            console.error('Error al cargar los prompts:', error);
        }
    };

    fetchPrompts();
  }, []);


  /* FILES */ 
  const handleFileUploadWithConfirmation = (e) => {
    if (studentResponses.length > 0) {
      const confirmLoad = window.confirm('Estás seguro de cargar nuevas respuestas? Ya tienes unas respuestas.');
      if (!confirmLoad) {
        return;
      }
    }

    handleFileUpload(e);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); 
    const files = e.dataTransfer.files;
  
    if (files.length > 0) {
      handleFileUploadWithConfirmation({ target: { files } });
    }
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
        } else if (fileType === 'xlsx') {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
          const headers = sheetData[0];
          setFileColumns(headers);
          setStudentResponses(sheetData);
          setShowSelectColumn(true);
        } else {
          setErrorMessage('Tipo de archivo no soportado. Por favor, cargue un archivo .txt, .csv o .xlsx');
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        }
      };
  
      if (fileType === 'txt' || fileType === 'csv') {
        reader.readAsText(file);
      } else if (fileType === 'xlsx') {
        reader.readAsArrayBuffer(file);
      }
    }
  }; 

  /* USER */

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('username');
    navigate('/login'); 
  };

  const updateStats = async (stats, responsesProcessed) => {
    try {
        await axios.post(`http://${apiUrl}:5000/api/auth/actualizar`, {
            inputTokens: stats.input_tokens,
            outputTokens: stats.output_tokens,
            responsesProcessed: responsesProcessed
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

    } catch (error) {
        console.error('Error al actualizar las estadísticas:', error);
    }
  };
  
  const handleProfile = () => {
    navigate('/perfil');
  };


  /* PROMPT */

  const handlePromptChange = (event) => {
        setPrompt(event.target.value);
  };

  const handleAnalyzePrompt = async () => {
    if (!prompt) {
        setErrorMessageEvaluatePrompt('Por favor, ingrese un prompt.');
        setTimeout(() => {
            setErrorMessageEvaluatePrompt('');
        }, 3000);
        return;
    }

    setIsLoadingEvaluate(true);

    try {
        const response = await axios.post(`http://${apiUrl}:4000/analyze-prompt`, { prompt });
        const analysis = response.data.analysis;
        setAnalysis(analysis);
        setIsAnalysisVisible(true);

        const promptId = selectedPromptId;
        if (!promptId) {
            console.error('No se ha proporcionado un ID de prompt.');
            return;
        }



        await axios.put(`http://${apiUrl}:5000/api/prompts/edit/${promptId}`, { evaluation: analysis }, { headers: getAuthHeaders() });
    } catch (error) {
        console.error('Error al analizar o guardar la evaluación del prompt:', error);
    } finally {
        setIsLoadingEvaluate(false);
    }
  };

  const handleClose = () => {
      setIsAnalysisVisible(false);
  };

  const handleOpen = () => {
    if (!analysis) {
        setErrorMessageEvaluatePrompt('No hay una evaluación guardada para este prompt.');
        setTimeout(() => {
            setErrorMessageEvaluatePrompt('');
        }, 3000);
        return;
    }

    setIsAnalysisVisible(true);
  };
  
  const handleClear = () => {
    setPrompt(''); 
    setEvaluatorId('');
    setStudentResponses('');
    setResult('');
    setShowSelectColumn(false);
    setSelectedEvaluatorId('');
    setIsPromptLoaded(false);
    setSelectedPromptId(null);
    setIsAnalysisVisible(false);
    setDescription('')
  };
    
  const handleSavePrompt = async () => {
    const batchLength = parseInt(queryBatchLength, 10);
    if (!prompt || !evaluatorId || !gptManager || isNaN(batchLength)) {
        setErrorMessagePrompt('Complete todos los campos requeridos.');
        setTimeout(() => {
          setErrorMessagePrompt(''); 
      }, 3000);
        return;
    }
    setErrorMessagePrompt('');
    setIsSaving(true);

    try {
        if (isPromptLoaded) {
            await axios.put(
                `http://${apiUrl}:5000/api/prompts/${evaluatorId}`,
                {
                    prompt,
                    description,
                    evaluator_id: evaluatorId,
                    gpt_manager: gptManager,
                    query_batch_length: batchLength,
                    temperature,
                },
                { headers: getAuthHeaders() }
            );
        } else {
            await axios.post(
                `http://${apiUrl}:5000/api/prompts`,
                {
                    prompt,
                    description,
                    evaluator_id: evaluatorId,
                    gpt_manager: gptManager,
                    query_batch_length: batchLength,
                    temperature,
                },
                { headers: getAuthHeaders() }
            );
        }

        setIsSaving(false);
        setIsSaved(true);
        setAnalysis(null)
        setIsPromptLoaded(true); 
        setErrorMessagePrompt('Prompt guardado correctamente');
        setTimeout(() => {
            setIsSaved(false);
            setErrorMessagePrompt(''); 
        }, 3000);
    } catch (error) {
        console.error('Error al guardar o actualizar el prompt:', error);
        setIsSaving(false);
    }
  };
  
  const handleLoadSavedPrompt = async () => {
    try {
        const response = await axios.get(`http://${apiUrl}:5000/api/prompts/user-prompts`, {
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
  
    if (evaluatorId === "") {
      setPrompt("");
      setDescription("");
      setEvaluatorId("");
      setSelectedEvaluatorId('');
      setIsPromptLoaded(false);
      setSelectedPromptId(null);
      setIsAnalysisVisible(false);
    } else {
      const selectedPromptData = savedPrompts.find((prompt) => prompt.evaluator_id === evaluatorId);
  
      if (selectedPromptData) {
        setPrompt(selectedPromptData.prompt);
        setDescription(selectedPromptData.description || '');
        setEvaluatorId(selectedPromptData.evaluator_id);
        setGptManager(selectedPromptData.gpt_manager);
        setQueryBatchLength(selectedPromptData.query_batch_length);
        setTemperature(selectedPromptData.temperature || 0.5);
        setIsPromptLoaded(true);
        setSelectedPromptId(selectedPromptData._id);
        setIsAnalysisVisible(false)
        setAnalysis(selectedPromptData.evaluation || null);
      }
    }
  };
  
  const updatePrompt = async () => {
    const updatedPromptData = {
      prompt: prompt,
      description: description || '',
      evaluator_id: evaluatorId,
      gpt_manager: gptManager,
      query_batch_length: queryBatchLength,
      temperature: temperature
    };
  
    try {
      const response = await axios.put(
        `http://${apiUrl}:5000/api/prompts/edit/${selectedPromptId}`, 
        updatedPromptData, 
        { headers: getAuthHeaders() }
      );
  
      const updatedPrompt = response.data.updatedPrompt;
  
      setSavedPrompts((prevPrompts) =>
        prevPrompts.map((prompt) =>
          prompt._id === updatedPrompt._id ? updatedPrompt : prompt
        )
      );
  
      setPrompt(updatedPrompt.prompt);
      setDescription(updatedPrompt.description || '');
      setEvaluatorId(updatedPrompt.evaluator_id);
      setGptManager(updatedPrompt.gpt_manager);
      setQueryBatchLength(updatedPrompt.query_batch_length);
      setTemperature(updatedPrompt.temperature);
      setIsPromptLoaded(true);
      setErrorMessagePrompt('Prompt actualizado correctamente');
  
      setTimeout(() => {
        setErrorMessagePrompt('');
      }, 3000);
  
    } catch (error) {
      console.error('Error al actualizar el prompt:', error);
    }
  };
  
    
  /* RESPONSES */
  const handleRandomSelect = () => {
    if (randomSelectCount > 0) {
      const totalResponses = studentResponses.length;
      const countToSelect = Math.min(randomSelectCount, totalResponses);
  
      const shuffledResponses = [...studentResponses];
      shuffledResponses.sort(() => Math.random() - 0.5); 
  
      const selected = shuffledResponses.slice(0, countToSelect); 
      setSelectedResponses(selected);
  
      
      setRandomlySelectedCount(countToSelect);
      setTimeout(() => {
        setRandomlySelectedCount(0);
    }, 3000);
    } else {
      setRandomlySelectedCount(0);
    }
  };
  
  const handleSelectAll = (event) => {
        if (event.target.checked) {
          setSelectedResponses(studentResponses);
        } else {
          setSelectedResponses([]);
        }
  };
    
  const handleCheckboxChange = (response) => {
        if (selectedResponses.includes(response)) {
          setSelectedResponses(selectedResponses.filter(item => item !== response)); 
        } else {
          setSelectedResponses([...selectedResponses, response]); 
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
    setSelectedColumn(selectedColumn);
    
    const columnIndex = fileColumns.indexOf(selectedColumn);
    if (columnIndex === -1) return; 
  
 
    const columnData = studentResponses.map(row => row[columnIndex]).filter(value => value);
  
    setStudentResponses(columnData);
  };

  /* EVALUATION */

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado.json'; 
    a.click();
    URL.revokeObjectURL(url);
};


  const handleSubmit = async () => {
        if (!prompt || selectedResponses.length === 0 || !evaluatorId) {
          setErrorMessage('Por favor, complete todos los campos.');
          setTimeout(() => {
            setErrorMessage(''); 
          }, 3000);
          return;
        }
    
        setErrorMessage('');
        setIsLoading(true);
    
        try {
          const response = await axios.post(`http://${apiUrl}:4000/evaluate`, {
            prompt,
            description,
            studentResponses: selectedResponses,
            evaluator_id: evaluatorId,
            gpt_manager: gptManager,
            query_batch_length: queryBatchLength,
            temperature,
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
                <div className=' border border-solid p-4 bg-gray-100 rounded-lg'>
                  <label htmlFor="savedPrompts" className="block ml-1 mb-2 border-b border-b-gray-500 text-xl font-bold font-sans">Seleccione un prompt guardado</label>
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
                        placeholder="Escriba el prompt aquí..."
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full h-96 lg:h-[60%] resize-none"
                        rows="4"
                      ></textarea>
                      <label htmlFor="description" className="block ml-1 mb-2 border-b border-b-gray-500 mt-4">Descripción del prompt</label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full h-24 mb-4 resize-none"
                        rows="3"
                        placeholder="Escriba una breve descripción del prompt aquí..."
                      ></textarea>
                    </div>
                    <div className='flex flex-col lg:w-[30%] lg:ml-4 justify-between'>
                      <p className="block mb-2 ml-1 border-b border-b-gray-500">Parámetros</p>
                      <label htmlFor="evaluatorId" className="block px-5 mt-2">Nombre del Prompt:</label>
                      <input
                        type="text"
                        id="evaluatorId"
                        value={evaluatorId}
                        onChange={(e) => setEvaluatorId(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 mx-5 mb-2"
                      />
                      <label htmlFor="gptManager" className="block px-5 mt-2">Selecciona el modelo de GPT:</label>
                      <select
                        id="gptManager"
                        value={gptManager}
                        onChange={(e) => setGptManager(e.target.value)}
                        className="border border-gray-300 rounded-xl px-4 py-2 mx-5 mb-3"
                      >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
                      </select>
                      <div className='flex flex-row items-center w-full mb-2 px-5 mt-2 '>
                        <label htmlFor="queryBatchLength" >Batch Length:</label>
                        <input
                          type="number"
                          id="queryBatchLength"
                          value={queryBatchLength}
                          onChange={(e) => setQueryBatchLength(e.target.value)}
                          className="border border-gray-300 rounded-xl h-10 w-20 ml-3 p-1"
                        />
                      </div>
                      <label htmlFor="temperature" className="block px-5 mt-2">Temperatura: {temperature} </label>
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
                      <div className='rounded mb-5 flex flex-col mt-2'>
                        <div className='flex flex-row justify-between'>
                          <button
                            onClick={handleClear}
                            className="bg-gray-300 hover:bg-gray-400 text-white font-bold ml-4 py-2 px-4 rounded-xl "
                            title="Clean"
                          >
                            <img src={clearIcon} alt="Limpiar" className="h-10 w-10" />
                          </button>
                          <button
                            onClick={isPromptLoaded ? updatePrompt : handleSavePrompt}
                            className={`flex items-center justify-center bg-gray-400 hover:bg-gray-500 text-white font-bold w-[50%] sm:w-[70%] lg:w-[60%] py-2 px-2 mr-2 rounded-xl ${isSaving || isSaved ? 'cursor-not-allowed' : ''}`}
                            disabled={isSaving || isSaved}
                          >
                            {isSaved ? (
                              <img src={checkIcon} alt="Guardado" className="h-10 w-10" />
                            ) : (
                              isPromptLoaded ? 'Actualizar Prompt' : 'Guardar Prompt'
                            )}
                          </button>
                        </div>
                        <div className='mt-1 min-h-8'>
                          {errorMessagePrompt && (
                            <div className="ml-4 text-black-500 flex justify-end mr-2">
                              {errorMessagePrompt}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className='ml-4 mr-2'>
                        <button 
                        onClick={handleAnalyzePrompt}
                        className='bg-gray-400 hover:bg-gray-500 text-white w-full font-bold py-2 px-4 rounded-xl'
                        disabled={isLoading}
                        >
                        {isLoadingEvaluate ? (
                            <img src={loadingIcon} alt="Cargando..." className="h-7 w-7 inline-block" />
                          ) : (
                            'Evaluar mi prompt'
                          )}
                          </button>
                          {isPromptLoaded && (
                            <div className="flex flex-row mt-2 content-center">
                              {analysis?.final?.valor === "Correcto" ? (
                                <img src={okIcon} alt="Correcto" className="w-8 h-8 mr-2" />
                              ) : analysis?.final?.valor === "error" ? (
                                <img src={errorIcon} alt="Error" className="w-8 h-8 mr-2" />
                              ) : (
                                <img src={alertaIcon} alt="Alerta" className="w-8 h-8 mr-2" />
                              )}
                              <button
                                onClick={handleOpen}
                                className="w-full px-4 py-1 text-black bg-gray-300 hover:bg-gray-400 rounded-xl"
                              >
                                Abrir última evaluación guardada
                              </button>
                            </div>
                          )}
                        <div className='mt-2 min-h-6 md:mr-2'>
                          {errorMessageEvaluatePrompt && (
                            <div className="ml-4 text-black-500 lg:flex lg:justify-end lg:mr-2">
                              {errorMessageEvaluatePrompt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {analysis && isAnalysisVisible && (
                    <div className= "flex flex-col bg-gray-100 p-6 rounded-lg shadow-md mt-6 space-y-4">
                      <div className='flex flex-col md:flex-row justify-between items-center'>
                        <h2 className="text-xl font-semibold text-gray-800">Resultado del análisis:</h2>
                        <button
                         onClick={handleClose}
                         className='bg-gray-400 mt-2 md:mt-0 hover:bg-gray-500 text-white w-full md:w-[25%] font-bold py-2 px-4 rounded-xl '
                        >
                          Cerrar análisis
                         </button>
                      </div>
                        <div className="space-y-4">
                          {/* Descripción */}
                          <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-medium text-gray-700">Descripción</h3>
                            <p className="text-gray-600">{analysis?.descripción?.justificación}</p>
                            <span className={`text-sm font-semibold ${analysis?.descripción?.valor === 'Correcto' ? 'text-green-600' : analysis?.descripción?.valor === 'Incorrecto' ? 'text-red-600' : 'text-yellow-600'}`}>
                              Valor: {analysis?.descripción?.valor}
                            </span>
                          </div>

                          {/* Rúbrica */}
                          <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-medium text-gray-700">Rúbrica</h3>
                            <p className="text-gray-600">{analysis?.rúbrica?.justificación}</p>
                            <span className={`text-sm font-semibold ${analysis?.rúbrica?.valor === 'Correcto' ? 'text-green-600' : analysis?.rúbrica?.valor === 'Incorrecto' ? 'text-red-600' : 'text-yellow-600'}`}>
                              Valor: {analysis?.rúbrica?.valor}
                            </span>
                          </div>

                          {/* Resultado */}
                          <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-lg font-medium text-gray-700">Resultado</h3>
                            <p className="text-gray-600">{analysis?.resultado?.justificación}</p>
                            <span className={`text-sm font-semibold ${analysis?.resultado?.valor === 'Correcto' ? 'text-green-600' : analysis?.resultado?.valor === 'Incorrecto' ? 'text-red-600' : 'text-yellow-600'}`}>
                              Valor: {analysis?.resultado?.valor}
                            </span>
                          </div>
                        </div>
                    </div>
                  )}
                </div>  
                
                { /* SECCION RESPUESTAS */ }
                <div className='mt-5 border border-solid p-4 bg-gray-100 rounded-lg'>
                  <div className='sm:flex sm:flex-col lg:flex lg:flex-row'>
                    <div className='flex flex-col lg:w-[70%] '>
                      <label htmlFor="studentResponses" className="block mb-2 border-b border-b-gray-500 text-xl font-bold font-sans">Respuestas de los estudiantes</label>
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
                      <label htmlFor="fileUpload" className="block text-lg font-semibold mb-2 text-gray-800">Cargar respuestas desde archivo (.txt, .csv, .xlsx):</label>
                      <div
                        className="border-2 border-dashed border-gray-400 rounded-lg p-8 text-center w-full bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                        onClick={() => document.getElementById('fileUpload').click()} 
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                      >
                        <span className="text-gray-500">Arrastra aquí tu archivo o haz clic para seleccionar uno</span>
                        
                        <input
                          id="fileUpload"
                          type="file"
                          accept=".txt,.csv,.xlsx"
                          onChange={handleFileUploadWithConfirmation}
                          className="hidden"
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="separator" className="block mb-2 mt-2">Indique el separador de campos (por defecto: ","):</label>
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
                      <div className="flex flex-col mb-4 min-h-20">
                        <div className='flex items-center'>
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
                        
                        <div>
                        {randomlySelectedCount > 0 && (
                          <div className="text-black-500 mt-1">
                            Se han seleccionado {randomlySelectedCount} respuestas al azar.
                          </div>
                        )}
                      </div>
                      </div>
                      <button
                          onClick={handleSubmit}
                          className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl"
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
                    <div className="text-red-500 mb-4 mt-3 lg:flex lg:justify-end lg:mr-2 ">
                      {errorMessage}
                    </div>
                  )}
                </div>
                
                { /* EVALUACION */ }
        
                {result && (
                  <div className="flex flex-col bg-gray-100 p-6 rounded-lg shadow-md mt-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">Resultado:</h2>
        
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
                    <h2 className='text-xl font-semibold text-gray-800'>Estadísticas de Uso:</h2>
                    {stats && (
                    <div>
                      <p><strong>Modelo GPT utilizado: </strong>{gptManager}</p>
                      <p><strong>Tokens de entrada:</strong> {stats.input_tokens}</p>
                      <p><strong>Tokens de salida:</strong> {stats.output_tokens}</p>
                      <p><strong>Tiempo transcurrido:</strong> {stats.elapsed_time} segundos</p>
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