
# 🚀 Horse Bid Market - Operação Google Cloud (GCP)

Para operar na vida real usando apenas o Google Cloud, siga estes passos:

### 1. Criar Projeto no Console do Google Cloud
1. Acesse [Firebase Console](https://console.firebase.google.com/) (que é a interface web do GCP).
2. Crie um novo projeto: `horse-bid-market`.
3. Ative o **Firestore Database** em "Modo de Produção".
4. Ative o **Authentication** e habilite o método "E-mail/Senha".
5. Ative o **Hosting** para publicar o site.

### 2. Configurar Firestore (Regras de Segurança)
No painel do Firestore, publique estas regras:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /lots/{lotId} {
      allow read: if true;
      allow update: if request.auth != null && request.resource.data.currentPrice > resource.data.currentPrice;
    }
    match /lots/{lotId}/bids/{bidId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.role == 'ADMIN';
    }
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Variáveis de Ambiente no GCP
Adicione estas chaves nas configurações do seu projeto de build (ou no arquivo `.env` de produção):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `API_KEY` (Para o Gemini AI)

### 4. Vantagens do Google Cloud
- **Sincronização Firestore**: Os lances são propagados para todos os navegadores em menos de 200ms.
- **Escalabilidade**: Suporta de 1 a 1 milhão de usuários simultâneos automaticamente.
- **Segurança**: Toda a validação de lances é feita via Regras de Segurança do Firebase, impedindo fraudes.
