# Stupid Radar Chart App 📊

Un'applicazione semplice ma efficace per generare diagrammi radar esportabili come PNG trasparente.

## 🚀 Come avviare l'applicazione

```bash
# Apri due terminali

# Terminal 1 - Backend API (FastAPI)
cd /root/projects/stupid-radar-app/backend
pip3 install fastapi uvicorn matplotlib numpy
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (serve sola static file)
cd /root/projects/stupid-radar-app/frontend
python3 -m http.server 8080
```

Oppure usa il script unificato:
```bash
chmod +x /root/projects/stupid-radar-app/start.sh
/root/projects/stupid-radar-app/start.sh
```

## 🔧 Funzionalità

- ✅ Form per configurare KPIs (Valori da 1 a 100)
- ✅ Generazione diagramma radar in tempo reale
- ✅ Esportazione PNG con sfondo trasparente
- ✅ Supporto metadata: title, author, deliverable_type
- ✅ Design glassmorphism moderno
- ✅ Drag-and-drop ready (no build required!)

## 📊 KPIs Supportati

1. **Author** - Chi ha sviluppato il progetto
2. **AI** - Livello di integrazione AI/ML
3. **Team** -Collaborazione di sistema
4. **Research** - Approfondimento scientifico
5. **Unspecified** - Altri aspetti

## 🛠️ Stack Tecnologico

- **Backend:** FastAPI + Matplotlib
- **Frontend:** Vanilla HTML/CSS/JS + Chart.js
- **Deployment:** Dockerizable, ready for Heroku/GCP Cloud Run

## 📁 Struttura Progetto

```
stupid-radar-app/
├── backend/
│   ├── main.py          # FastAPI application
│   └── requirements.txt
├── frontend/
│   ├── index.html       # Single page application
│   └── package.json
├── start.sh             # Script di avvio
└── README.md
```

## 🔗 Accesso

Dopo aver avviato i server:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎨 Customizzazione

Modifica i KPIs editando:
- **Frontend:** `index.html` section `<!-- KPI Sliders -->`
- **Backend:** `main.py` section `RadarRequest` model

## 🐛 Troubleshooting

**Permission denied on port 8000?**
```bash
sudo lsof -i :8000
```

**SVG to PNG conversion failing?**
Assicurati che `cairosvg` sia installato:
```bash
pip3 install cairosvg
```

## 📝 License

MIT - Made with ❤️ by Andrea Carmisciano
