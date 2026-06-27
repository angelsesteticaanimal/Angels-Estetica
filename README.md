# Angels Estética Animal V7 - Firebase

Esta versão já possui integração com Firebase Firestore.

## Para ativar

1. Crie um projeto no Firebase.
2. Crie um app Web dentro do projeto.
3. Ative o Firestore Database.
4. Copie o objeto `firebaseConfig`.
5. Cole no arquivo `firebase-config.js`.
6. Troque:
   window.firebaseEnabled = false;
   para:
   window.firebaseEnabled = true;

## Coleção usada

agendamentos

## Campos principais

tutor, whatsapp, pet, raca, servico, porte, data, hora, busca, obs, status, origem, criadoEm

## APK

O workflow do GitHub Actions já está atualizado para gerar:
Angels-Estetica-Animal-V7-Firebase-APK
