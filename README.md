# CapinIA Frontend RAG Chat

Este proyecto es un **frontend web** basado en tecnología [Lovable](https://lovable.dev), diseñado para integrarse como un **chat embebido en el TMS** de Insecap SPA.

## 📌 Objetivo

Proporcionar una interfaz de usuario moderna para interactuar con el servicio RAG (Retrieval-Augmented Generation) que utiliza **Azure Cosmos DB NoSQL** y **modelos OpenAI**.  
El chat permitirá a los usuarios consultar información de cursos, clientes, participantes, documentos y procesos internos, respetando **roles de acceso** y **sensibilidad** de la información.

## 🚀 Tecnologías utilizadas

- **Vite** – Empaquetador rápido para desarrollo y producción.
- **TypeScript** – Tipado estático para JavaScript.
- **React** – Librería para construir interfaces de usuario.
- **shadcn-ui** – Componentes UI modernos y accesibles.
- **Tailwind CSS** – Framework CSS utilitario.

## 📂 Estructura del proyecto

```
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Funciones utilitarias
│   ├── styles/          # Estilos globales
│   ├── main.tsx         # Punto de entrada React
│   └── App.tsx          # Componente raíz
├── index.html           # HTML base
├── package.json         # Dependencias y scripts
└── tailwind.config.js   # Configuración de Tailwind
```

## 🛠 Instalación y ejecución

Requisitos previos:
- Node.js >= 18
- npm >= 9

Pasos para ejecutar el proyecto en local:

```sh
# Clonar el repositorio
git clone https://github.com/CapinIA/Chat-service
cd Chat-service

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 🔗 Integración con TMS

El chat puede ser embebido en el TMS mediante un **iframe** o componente web, apuntando a la URL de despliegue de este frontend.  
Se recomienda configurar el dominio y permisos CORS en el servicio backend para permitir la carga dentro del TMS.

## 📦 Despliegue

Puede desplegarse en cualquier plataforma compatible con proyectos estáticos de Vite, como:
- Azure Static Web Apps
- Vercel
- Netlify
- GitHub Pages

## 📜 Licencia

Uso interno exclusivo para Insecap SPA.
