import { criarApp } from "./app.ts";

// 8000 já é da API em Python; o Akinator usa outra porta para os dois rodarem juntos.
const porta = Number(process.env.PORT ?? 3001);

criarApp().listen(porta, () => {
  console.log(`API do Akinator em http://localhost:${porta}/api/akinator`);
});
