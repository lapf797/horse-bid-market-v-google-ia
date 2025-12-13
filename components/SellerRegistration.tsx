
import React, { useState } from 'react';
import { SellerSubmission } from '../types';

interface Props {
  onCancel: () => void;
  onSubmit: (submission: SellerSubmission) => void;
}

const SellerRegistration: React.FC<Props> = ({ onCancel, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Crawler State
  const [searchMode, setSearchMode] = useState<'REGISTRATION' | 'NAME'>('NAME');
  const [abcchQuery, setAbcchQuery] = useState('');
  const [isAbcchVerified, setIsAbcchVerified] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<SellerSubmission>>({
    name: '',
    breed: '',
    dob: '',
    gender: 'Stallion',
    sire: '',
    dam: '',
    damSire: '',
    discipline: '',
    height: '',
    description: '',
    youtubeLink: '',
    sellerName: '',
    sellerEmail: '',
    targetPrice: 0,
    photos: { left: '', right: '', front: '', back: '', legs: '', head: '' },
    documents: []
  });

  const handleAbcchSearch = () => {
    if (!abcchQuery) {
        alert("Por favor, digite o nome ou registro para pesquisar.");
        return;
    }
    setLoading(true);

    // SIMULATION OF BACKEND CRAWLER
    // In a real scenario, this would call: axios.get(`/api/abcch/search?q=${abcchQuery}`)
    setTimeout(() => {
        // Dynamic Mock Data Generation based on user input to simulate a "Real" find
        const queryUpper = abcchQuery.toUpperCase();
        
        // Simulate generating realistic data based on the input
        const mockResult = {
            abcchId: searchMode === 'REGISTRATION' ? queryUpper : `00${Math.floor(Math.random() * 90000)}-BH`,
            name: searchMode === 'NAME' ? queryUpper : "CAVALO ENCONTRADO (EXEMPLO)",
            breed: "Brasileiro de Hipismo (BH)",
            dob: "2018-08-22", // Fixed date for demo
            sire: "CASALL (DE)", // Famous Sire example
            dam: "SORDINA JMEN", // Famous Dam example
            damSire: "RITUAL JMEN",
            gender: "Stallion", // Defaulting to Stallion
            height: "1.72m"
        };

        setFormData(prev => ({
            ...prev,
            ...mockResult as any
        }));
        setIsAbcchVerified(true);
        setLoading(false);
    }, 1500); // 1.5s delay to simulate network request
  };

  const resetAbcch = () => {
      setFormData(prev => ({
          ...prev,
          abcchId: '',
          name: '',
          breed: '',
          dob: '',
          sire: '',
          dam: '',
          damSire: '',
          gender: 'Stallion',
          height: ''
      }));
      setAbcchQuery('');
      setIsAbcchVerified(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Prevent editing if verified and field is one of the locked ones
    if (isAbcchVerified && ['name', 'breed', 'dob', 'sire', 'dam', 'damSire', 'gender'].includes(name)) {
        return; 
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (key: keyof SellerSubmission['photos']) => {
      // Mock upload
      const dummyUrl = `https://picsum.photos/seed/${key}${Math.random()}/300/200`;
      setFormData(prev => ({
          ...prev,
          photos: {
              ...prev.photos!,
              [key]: dummyUrl
          }
      }));
  };

  const handleFinalSubmit = () => {
      setLoading(true);
      setTimeout(() => {
          const newSubmission: SellerSubmission = {
              id: `sub-${Date.now()}`,
              status: 'PENDING',
              createdAt: new Date(),
              documents: [],
              ...formData as SellerSubmission
          };
          onSubmit(newSubmission);
          setLoading(false);
      }, 2000);
  };

  // Helper for locked input styling
  // Added explicit bg-white and text-gray-900 for the unlocked state
  const getInputClass = (isLocked: boolean) => 
    `w-full p-3 border rounded transition-all flex items-center justify-between ${
        isLocked 
        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed font-bold select-none opacity-80' 
        : 'bg-white text-gray-900 border-gray-300 focus:border-equus-gold focus:ring-1 focus:ring-equus-gold'
    }`;

  // Reusable Field Component
  const LockedField = ({ label, name, value, type = 'text', options }: any) => (
      <div className="relative group">
          <label className="block text-xs font-bold text-equus-navy uppercase mb-1 flex items-center gap-1">
              {label}
              {isAbcchVerified && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className="text-green-600" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  </svg>
              )}
          </label>
          {type === 'select' ? (
               <select 
                    name={name} 
                    value={value} 
                    onChange={handleInputChange} 
                    disabled={isAbcchVerified} 
                    className={getInputClass(isAbcchVerified)}
               >
                   {options}
               </select>
          ) : (
            <div className="relative">
               <input 
                    type={type}
                    name={name} 
                    value={value} 
                    onChange={handleInputChange} 
                    disabled={isAbcchVerified} 
                    className={getInputClass(isAbcchVerified)} 
               />
               {isAbcchVerified && (
                   <div className="absolute right-3 top-3 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M10 9.05a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                            <path d="M2 1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2Zm12 1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12Z"/>
                            <path d="M13.375 12.033a.5.5 0 0 0 .125.342c1 .002 1 1.5 0 1.5a.5.5 0 1 1 0-1 .5.5 0 0 0 0-1l-.125-.002c-1.002-.002-1.002-1.502 0-1.502.335 0 .335.662 0 .662Z"/>
                            <path fillRule="evenodd" d="M2 7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H2Zm12 1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h12Z"/>
                        </svg>
                   </div>
               )}
            </div>
          )}
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-sm overflow-hidden my-8">
        {/* Header */}
        <div className="bg-equus-navy text-white p-6 flex justify-between items-center">
            <h2 className="text-2xl font-serif font-bold tracking-widest">CADASTRO DE ANIMAL</h2>
            <div className="text-sm opacity-80">Passo {step} de 4</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
            <div 
                className="bg-equus-gold h-2 transition-all duration-500" 
                style={{ width: `${(step/4)*100}%` }}
            ></div>
        </div>

        <div className="p-8 min-h-[500px]">
            {/* STEP 1: GENEALOGY & BASIC INFO */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* CRAWLER INTERFACE */}
                    <div className="bg-[#F8F9FA] p-6 rounded border border-gray-200 shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-bold text-equus-navy uppercase flex items-center gap-2">
                                <span className="bg-equus-navy text-white text-[10px] px-2 py-1 rounded font-bold">Oficial</span>
                                Importar Dados ABCCH
                            </label>
                            <a href="https://abcch.com.br/studbook/genealogia" target="_blank" className="text-xs text-blue-600 hover:underline">
                                Consultar site oficial ↗
                            </a>
                        </div>
                        
                        {!isAbcchVerified ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="mode" checked={searchMode === 'NAME'} onChange={() => setSearchMode('NAME')} className="accent-equus-gold" />
                                        Buscar por Nome do Animal (Exato)
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="mode" checked={searchMode === 'REGISTRATION'} onChange={() => setSearchMode('REGISTRATION')} className="accent-equus-gold" />
                                        Buscar por Registro/Chip
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder={searchMode === 'NAME' ? "Nome do Animal (Ex: CASSINI II)" : "Nº do Registro ou Chip"}
                                        value={abcchQuery}
                                        onChange={(e) => setAbcchQuery(e.target.value)}
                                        className="flex-1 p-3 border border-gray-300 rounded focus:border-equus-gold focus:outline-none uppercase font-mono bg-white text-gray-900"
                                    />
                                    <button 
                                        onClick={handleAbcchSearch}
                                        disabled={loading}
                                        className="bg-equus-navy text-white px-6 font-bold uppercase text-sm rounded hover:bg-opacity-90 transition-colors flex items-center gap-2 min-w-[140px] justify-center"
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Buscando...
                                            </>
                                        ) : (
                                            'Validar'
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    * A busca é realizada na base de dados pública. Certifique-se de digitar o nome <strong>exato do animal</strong> conforme registro.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded text-green-800 animate-fade-in">
                                <div>
                                    <span className="font-bold flex items-center gap-2 text-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                        </svg>
                                        Animal Verificado na Base Oficial
                                    </span>
                                    <p className="text-sm mt-1 opacity-80">As informações vitais foram importadas e bloqueadas para garantir a integridade do leilão.</p>
                                </div>
                                <button onClick={resetAbcch} className="text-xs uppercase underline font-bold hover:text-green-600 bg-white px-3 py-2 rounded border border-green-200">
                                    Nova Busca
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <LockedField label="Nome do Animal" name="name" value={formData.name} />
                        <LockedField label="Raça" name="breed" value={formData.breed} />
                        <LockedField label="Data de Nascimento" name="dob" value={formData.dob} type="date" />
                        
                        <LockedField 
                            label="Sexo" 
                            name="gender" 
                            value={formData.gender} 
                            type="select" 
                            options={
                                <>
                                    <option value="Stallion">Garanhão (Stallion)</option>
                                    <option value="Mare">Égua (Mare)</option>
                                    <option value="Gelding">Castrado (Gelding)</option>
                                </>
                            } 
                        />

                        <LockedField label="Pai (Sire)" name="sire" value={formData.sire} />
                        <LockedField label="Mãe (Dam)" name="dam" value={formData.dam} />
                        <LockedField label="Avô Materno" name="damSire" value={formData.damSire} />
                        
                        <div className="relative group">
                            <label className="block text-xs font-bold text-equus-navy uppercase mb-1">Altura (m)</label>
                            <input 
                                name="height" 
                                value={formData.height} 
                                onChange={handleInputChange} 
                                placeholder="Ex: 1.70m" 
                                className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-equus-navy uppercase mb-1">Descrição Comercial</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleInputChange} 
                            rows={4} 
                            className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold bg-white text-gray-900" 
                            placeholder="Descreva os pontos fortes, temperamento e potencial esportivo..."
                        ></textarea>
                    </div>
                </div>
            )}

            {/* STEP 2: MEDIA (PHOTOS & VIDEO) */}
            {step === 2 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-serif font-bold text-equus-navy">Galeria de Fotos</h3>
                        <p className="text-gray-500 text-sm">É obrigatório o envio das 6 fotos padrão para padronização do catálogo.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {['left', 'right', 'front', 'back', 'legs', 'head'].map((pos) => (
                            <div key={pos} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[160px] bg-gray-50 hover:bg-white hover:border-equus-gold transition-colors cursor-pointer group" onClick={() => handlePhotoUpload(pos as any)}>
                                {formData.photos && formData.photos[pos as keyof typeof formData.photos] ? (
                                    <div className="relative w-full h-full">
                                        <img src={formData.photos[pos as keyof typeof formData.photos]} alt={pos} className="w-full h-32 object-cover rounded" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold uppercase">Alterar</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-4xl text-gray-300 mb-2 group-hover:text-equus-gold">+</div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-equus-navy">
                                            {pos === 'left' ? 'Lateral Esquerda' : 
                                             pos === 'right' ? 'Lateral Direita' :
                                             pos === 'front' ? 'Frente' :
                                             pos === 'back' ? 'Trás' :
                                             pos === 'legs' ? 'Aprumos' : 'Cabeça'}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <label className="block text-xs font-bold text-equus-navy uppercase mb-2">Link do YouTube</label>
                        <input 
                            name="youtubeLink" 
                            value={formData.youtubeLink} 
                            onChange={handleInputChange} 
                            placeholder="https://youtu.be/..."
                            className="w-full p-3 border border-gray-300 rounded focus:border-equus-gold bg-white text-gray-900" 
                        />
                        <p className="text-xs text-gray-400 mt-1">Insira o link completo do vídeo do animal em movimento/salto.</p>
                    </div>
                </div>
            )}

            {/* STEP 3: DOCUMENTS & SELLER INFO & PRICE */}
            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-serif font-bold text-equus-navy mb-4">Documentação Veterinária</h3>
                    
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <p className="text-sm text-yellow-800">
                            Recomendamos o upload de <strong>Vet Check recente</strong> e <strong>Raio-X (até 6 meses)</strong>. Animais com documentação completa tendem a valorizar até 30% mais.
                        </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center cursor-pointer hover:border-equus-navy">
                        <p className="font-bold text-gray-600">Clique para selecionar arquivos (PDF)</p>
                        <p className="text-xs text-gray-400 mt-2">Vet Check, RX, Registro, etc.</p>
                    </div>

                    <div className="border-t border-gray-200 pt-8 mt-8">
                        <h3 className="text-xl font-serif font-bold text-equus-navy mb-4">Informações de Venda</h3>
                        
                        {/* Target Price */}
                        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                             <label className="block text-xs font-bold text-equus-navy uppercase mb-2">Valor Objetivo (Pretensão de Venda)</label>
                             <div className="flex items-center">
                                <span className="p-3 bg-gray-200 text-gray-500 font-bold border border-r-0 border-gray-300 rounded-l">R$</span>
                                <input 
                                    name="targetPrice" 
                                    type="number"
                                    value={formData.targetPrice || ''} 
                                    onChange={handleInputChange} 
                                    placeholder="Ex: 50000"
                                    className="w-full p-3 border border-gray-300 rounded-r focus:border-equus-gold bg-white text-gray-900" 
                                />
                             </div>
                             <p className="text-xs text-gray-500 mt-1">Este valor serve como referência para a aprovação do leiloeiro e não será exibido publicamente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-equus-navy uppercase mb-1">Nome Completo / Haras</label>
                                <input 
                                    name="sellerName" 
                                    value={formData.sellerName} 
                                    onChange={handleInputChange} 
                                    className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-equus-navy uppercase mb-1">Email de Contato</label>
                                <input 
                                    name="sellerEmail" 
                                    value={formData.sellerEmail} 
                                    onChange={handleInputChange} 
                                    className="w-full p-3 border border-gray-300 rounded bg-white text-gray-900" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* STEP 4: CONTRACT & TERMS (NO PAYMENT) */}
             {step === 4 && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-white border border-gray-200 p-6 rounded shadow-sm">
                        <h3 className="text-xl font-serif font-bold text-equus-navy mb-4">Termos e Condições</h3>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                            <h4 className="font-bold text-blue-900 text-sm mb-1">Processo de Aprovação</h4>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                Seu animal será enviado para análise da nossa equipe técnica. Caso aprovado para o leilão, você receberá uma notificação por email contendo o link para pagamento da <strong>Taxa de Inscrição (R$ 450,00)</strong> e as instruções finais para o evento.
                            </p>
                        </div>

                        <div className="h-40 overflow-y-auto bg-gray-50 p-4 border border-gray-200 rounded text-xs text-gray-600 mb-4 leading-relaxed">
                            <p className="mb-2 font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE LEILÃO</p>
                            <p className="mb-2">1. O VENDEDOR autoriza a plataforma HORSE BID MARKET a intermediar a venda do animal descrito neste cadastro.</p>
                            <p className="mb-2">2. A comissão de venda será de 8% (oito por cento) sobre o valor final do arremate, a ser paga pelo comprador.</p>
                            <p className="mb-2">3. O VENDEDOR garante a veracidade das informações genealógicas e sanitárias fornecidas.</p>
                            <p>4. O não pagamento da taxa de inscrição após a aprovação acarretará no cancelamento do cadastro.</p>
                            {/* ... more legalese ... */}
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-100 rounded border border-gray-200">
                            <input type="checkbox" className="mt-1 w-5 h-5 text-equus-navy" />
                            <p className="text-sm text-gray-700">
                                Declaro que li e concordo com os <strong>Termos de Uso</strong> e o <strong>Contrato de Venda</strong>. Confirmo que sou o proprietário legal ou representante autorizado do animal.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-100 p-6 flex justify-between border-t border-gray-200">
            {step === 1 ? (
                <button onClick={onCancel} className="px-6 py-3 text-gray-500 hover:text-red-600 font-bold uppercase text-xs tracking-wider">Cancelar</button>
            ) : (
                <button onClick={() => setStep(step - 1)} className="px-6 py-3 text-gray-600 font-bold uppercase text-xs tracking-wider hover:bg-gray-200 rounded">Voltar</button>
            )}

            {step < 4 ? (
                <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-equus-navy text-white font-bold uppercase text-xs tracking-wider rounded shadow-md hover:bg-equus-gold transition-colors">
                    Próximo Passo
                </button>
            ) : (
                <button onClick={handleFinalSubmit} disabled={loading} className="px-8 py-3 bg-green-600 text-white font-bold uppercase text-xs tracking-wider rounded shadow-md hover:bg-green-500 transition-colors animate-pulse">
                    {loading ? 'Enviando...' : 'Enviar Cadastro'}
                </button>
            )}
        </div>
    </div>
  );
};

export default SellerRegistration;
