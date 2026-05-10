from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict
import matplotlib.pyplot as plt
import numpy as np
import tempfile
import os

app = FastAPI(title="Stupid Radar Chart API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RadarRequest(BaseModel):
    title: str
    author: str
    deliverable_type: str
    kpis: Dict[str, int]

@app.post("/generate-radar")
async def generate_radar(request: RadarRequest):
    try:
        # KPIs from request
        kpis = request.kpis
        kpi_names = list(kpis.keys())
        values = list(kpis.values())
        
        # Validate values are 1-100
        for name, val in kpis.items():
            if not 1 <= val <= 100:
                raise HTTPException(status_code=400, detail=f"KPI '{name}' has invalid value {val}. Must be 1-100.")
        
        if len(kpis) == 0:
            raise HTTPException(status_code=400, detail="At least one KPI is required.")
        
        # Create radar chart with transparent background
        fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
        fig.patch.set_alpha(0)  # Transparent figure background
        
        # Calculate angles for each KPI
        angles = np.linspace(0, 2 * np.pi, len(kpi_names), endpoint=False).tolist()
        
        # Close the loop
        values += values[:1]
        angles += angles[:1]
        
        # Plot data
        ax.fill(angles, values, 'b', alpha=0.3)
        ax.plot(angles, values, 'b', linewidth=2)
        
        # Set labels
        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(kpi_names)
        
        # Set y-axis range
        ax.set_ylim(0, 100)
        
        # Add title
        plt.title(f"{request.title}\nby {request.author}", pad=20)
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, f"radar_{request.author.replace(' ', '_')}.png")
        
        plt.savefig(output_path, bbox_inches='tight', dpi=100, transparent=True)
        plt.close()
        
        return {"status": "success", "image_path": output_path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating radar chart: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Stupid Radar Chart API - v1.0"}
