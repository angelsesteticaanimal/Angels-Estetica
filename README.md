# Angels Estética Animal - App V4 com Logo

Esta versão já usa a logo enviada no cabeçalho, ícone e identidade visual do app.

## Para testar no Android

1. Baixe o ZIP.
2. Descompacte.
3. Abra a pasta.
4. Toque no arquivo `index.html`.
5. Escolha abrir com o Chrome.

## Para gerar APK

Esta pasta já está preparada para Capacitor.

No computador, com Node.js e Android Studio instalados:

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Depois, no Android Studio:
- Build
- Build Bundle(s) / APK(s)
- Build APK(s)

## Observação

O app já está com a logo, mas ainda usa armazenamento local no celular.
Na próxima etapa podemos integrar Firebase para sincronizar celular e computador.
