
import React, { useState } from 'react';
import { SellerSubmission } from '../types';
import { supabase, isSupabaseConfigured, submitHorseForReview } from '../services/supabase';

interface Props {
  onCancel: () => void;
  onSubmit: (submission: SellerSubmission) => void;
}

const SellerRegistration: React.FC<Props> = ({ onCancel, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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
    youtubeLink: '', // Link principal
    youtubeLink2: '', // Link secundário (novo)
    sellerName: '',
    sellerEmail: '',
    targetPrice: 0,
    // Armazenaremos URLs ou strings base64 aqui
    galleryPhotos: ['', '', '', '', '', ''],
    documentLinks: [{ title: '', url: '' }, { title: '', url: '' }]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (index: number, value: string) => {
    const newPhotos = [...(formData.galleryPhotos || [])];
    newPhotos[index] = value;
    setFormData(prev => ({ ...prev, galleryPhotos: newPhotos }));
  };

  const handleDocChange = (index: number, field: 'title' | 'url', value: string) => {
    const newDocs = [...(formData.documentLinks || [])];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setFormData(prev => ({ ...prev, documentLinks: newDocs }));
  };

  const handleFinalSubmit = async () => {
      setLoading(true);
      try {
          // Em um app real, aqui faríamos o upload dos arquivos para o Storage
          // Por agora, simulamos o envio dos dados coletados
          if (isSupabaseConfigured) {
              const { data: { session } } = await supabase.auth.getSession();
              await submitHorseForReview(formData, session?.user.id || 'anonymous');
          }
          
          alert("Cadastro enviado com sucesso! Nossa curadoria analisará as fotos, vídeos e documentos anexados.");
          onSubmit(formData as SellerSubmission);
      } catch (e) {
          console.error(e);
          alert("Erro ao enviar cadastro.");
      } finally {
          setLoading(false);
      }
  };

  const getInputClass = () => 
    `w-full p-3 border border-gray-300 rounded transition-all bg-white text-gray-900 focus:border-equus-gold focus:ring-1 focus:ring-equus-gold outline-none text-sm`;

  const FormField = ({ label, name, value, type = 'text', options, placeholder }: any) => (
      <div className="relative group">
          <label className="block text-[10px] font-bold text-equus-navy uppercase mb-1 tracking-widest">{label}</label>
          {type === 'select' ? (
               <select name={name} value={value} onChange={handleInputChange} className={getInputClass()}>{options}</select>
          ) : (
            <input type={type} name={name} value={value} onChange={handleInputChange} className={getInputClass()} placeholder={placeholder} />
          )}
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden my-12 border border-gray-100">
        <div className="bg-equus-navy text-white p-8 flex justify-between items-center border-b-2 border-equus-gold">
            <div className="flex flex-col">
                <h2 className="text-3xl font-serif font-bold tracking-tighter uppercase italic">Venda seu Cavalo</h2>
                <span className="text-[10px] text-equus-gold font-bold uppercase tracking-[0.3em]">Plataforma de Leilão Automático</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/20">
                Passo {step} de 4
            </div>
        </div>
        <div className="w-full bg-gray-100 h-1.5">
            <div className="bg-equus-gold h-1.5 transition-all duration-700 ease-in-out shadow-[0_0_15px_rgba(197,160,89,0.6)]" style={{ width: `${(step/4)*100}%` }}></div>
        </div>

        <div className="p-8 md:p-12 min-h-[600px]">
            {step === 1 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-equus-navy uppercase tracking-tighter mb-2 italic">1. Identificação do Animal</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Dados técnicos e genealógicos essenciais</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FormField label="Nome do Cavalo" name="name" value={formData.name} placeholder="Nome Oficial" />
                        <FormField label="Raça / Registro" name="breed" value={formData.breed} placeholder="Ex: BH, Quarto de Milha..." />
                        <FormField label="Nascimento" name="dob" value={formData.dob} type="date" />
                        <FormField label="Gênero" name="gender" value={formData.gender} type="select" options={
                            <>
                                <option value="Stallion">Garanhão</option>
                                <option value="Mare">Égua</option>
                                <option value="Gelding">Castrado</option>
                            </>
                        }/>
                        <FormField label="Altura (m)" name="height" value={formData.height} placeholder="Ex: 1.70" />
                        <FormField label="Modalidade" name="discipline" value={formData.discipline} placeholder="Ex: Salto, Adestramento..." />
                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-gray-100">
                            <FormField label="Pai (Sire)" name="sire" value={formData.sire} />
                            <FormField label="Mãe (Dam)" name="dam" value={formData.dam} />
                            <FormField label="Avô Materno" name="damSire" value={formData.damSire} />
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-equus-navy uppercase tracking-tighter mb-2 italic">2. Vídeos e Descrição</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Apresentação visual e performance</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="group">
                                <label className="block text-[10px] font-bold text-equus-navy uppercase mb-1 tracking-widest">Resumo Comercial</label>
                                <textarea 
                                    name="description" 
                                    value={formData.description} 
                                    onChange={handleInputChange} 
                                    className={`${getInputClass()} h-48 resize-none`}
                                    placeholder="Destaque as principais qualidades, histórico de competições e temperamento..."
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <FormField label="Link YouTube 1 (Morfologia)" name="youtubeLink" value={formData.youtubeLink} placeholder="https://youtube.com/watch?v=..." />
                            <FormField label="Link YouTube 2 (Performance)" name="youtubeLink2" value={formData.youtubeLink2} placeholder="https://youtube.com/watch?v=..." />
                            <div className="bg-gray-50 p-6 rounded border-l-4 border-equus-gold flex items-center gap-4 mt-4">
                                <div className="text-equus-navy opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm11.5 1a.5.5 0 0 0-.5.5v3.793L9.146 7.447a.5.5 0 0 0-.708 0L3 12.854V13h10v-.146l-1.5-1.5V5.5a.5.5 0 0 0-.5-.5z"/></svg>
                                </div>
                                <p className="text-[10px] font-bold uppercase text-gray-500 leading-relaxed tracking-widest">
                                    Vídeos de boa qualidade aumentam em até 80% as chances de venda e o valor dos lances.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-10 animate-fade-in">
                    <div>
                        <h3 className="text-2xl font-serif font-bold text-equus-navy uppercase tracking-tighter mb-2 italic">3. Galeria de Fotos (Até 6)</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Imagens em alta definição para o catálogo</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {formData.galleryPhotos?.map((photo, idx) => (
                            <div key={idx} className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Foto {idx + 1}</label>
                                <div className="relative group aspect-[4/3] bg-gray-50 border-2 border-dashed border-gray-200 rounded flex flex-col items-center justify-center overflow-hidden hover:border-equus-gold transition-all">
                                    {photo ? (
                                        <img src={photo} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                                    ) : (
                                        <div className="text-center p-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="mx-auto mb-2 text-gray-300" viewBox="0 0 16 16"><path d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm1 0v12h12V2H1zm3.5 1a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h1zm0 4a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h1z"/></svg>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase">Insira a URL da Foto</span>
                                        </div>
                                    )}
                                    <input 
                                        type="text" 
                                        placeholder="URL da Imagem..."
                                        value={photo}
                                        onChange={(e) => handlePhotoChange(idx, e.target.value)}
                                        className="absolute bottom-0 left-0 w-full p-2 bg-white/90 text-[10px] outline-none border-t border-gray-100 focus:bg-white"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-12 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-equus-navy uppercase tracking-tighter mb-2 italic">4. Documentos & Valor</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Arquivos PDF e Expectativa Comercial</p>
                            </div>
                            
                            <div className="space-y-6">
                                <label className="block text-[10px] font-bold text-equus-navy uppercase tracking-widest mb-1">Anexar Documentos (PDF)</label>
                                {formData.documentLinks?.map((doc, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input 
                                            placeholder="Título (ex: Vet Check)" 
                                            value={doc.title}
                                            onChange={(e) => handleDocChange(idx, 'title', e.target.value)}
                                            className="w-1/3 p-3 border border-gray-300 rounded text-xs" 
                                        />
                                        <input 
                                            placeholder="URL do PDF..." 
                                            value={doc.url}
                                            onChange={(e) => handleDocChange(idx, 'url', e.target.value)}
                                            className="flex-1 p-3 border border-gray-300 rounded text-xs" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-10 rounded border border-gray-100 space-y-8">
                            <FormField label="Valor de Reserva (Total R$)" name="targetPrice" value={formData.targetPrice} type="number" placeholder="Preço mínimo aceitável" />
                            <FormField label="Nome para Contato" name="sellerName" value={formData.sellerName} placeholder="Seu Nome Completo" />
                            <FormField label="E-mail" name="sellerEmail" value={formData.sellerEmail} type="email" placeholder="Para receber o contrato" />
                            
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded border border-emerald-100">
                                <div className="text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/></svg>
                                </div>
                                <p className="text-[9px] font-bold uppercase text-emerald-800 tracking-widest">
                                    Seus dados comerciais e documentos são protegidos por criptografia e só serão expostos ao comprador arrematante.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-gray-100">
                        <button 
                            onClick={handleFinalSubmit} 
                            disabled={loading} 
                            className="bg-equus-navy text-white px-16 py-6 rounded-sm font-bold uppercase text-sm tracking-[0.3em] hover:bg-equus-gold hover:text-equus-navy transition-all shadow-2xl disabled:opacity-50"
                        >
                            {loading ? 'Sincronizando Dados...' : 'Finalizar e Enviar para Curadoria'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="bg-gray-50 p-10 flex justify-between border-t border-gray-200">
            <button 
                onClick={() => step > 1 ? setStep(step - 1) : onCancel()} 
                className="px-10 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors"
            >
                {step === 1 ? 'Sair' : 'Voltar'}
            </button>
            
            {step < 4 && (
                <button 
                    onClick={() => setStep(step + 1)} 
                    className="px-14 py-4 bg-equus-navy text-white font-bold uppercase text-[10px] tracking-[0.3em] rounded-sm shadow-xl hover:bg-equus-gold transition-all flex items-center gap-3"
                >
                    Próximo Passo
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/></svg>
                </button>
            )}
        </div>
    </div>
  );
};

export default SellerRegistration;
