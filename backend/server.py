from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'poolbalance')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Pool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    volume_liters: float
    volume_gallons: float
    default_units: str = "metric"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PoolCreate(BaseModel):
    name: str
    volume_liters: float
    volume_gallons: float
    default_units: str = "metric"

class CalculationRequest(BaseModel):
    calculation_type: str  # 'chlorine', 'ph', 'alkalinity', 'cyanuric_acid'
    current_value: float
    target_value: float
    pool_volume_liters: float
    product_type: str
    product_concentration: Optional[float] = None
    pool_id: Optional[str] = None

class CalculationResult(BaseModel):
    amount: float
    unit: str
    notes: str
    calculation_details: dict

# Pool endpoints
@api_router.get("/")
async def root():
    return {"message": "PoolBalance API"}

@api_router.post("/pools", response_model=Pool)
async def create_pool(pool_data: PoolCreate):
    try:
        pool = Pool(**pool_data.dict())
        await db.pools.insert_one(pool.dict())
        return pool
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pools", response_model=List[Pool])
async def get_pools():
    try:
        pools = await db.pools.find().to_list(1000)
        return [Pool(**pool) for pool in pools]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pools/{pool_id}", response_model=Pool)
async def get_pool(pool_id: str):
    try:
        pool = await db.pools.find_one({"id": pool_id})
        if pool:
            return Pool(**pool)
        raise HTTPException(status_code=404, detail="Pool not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/pools/{pool_id}")
async def delete_pool(pool_id: str):
    try:
        result = await db.pools.delete_one({"id": pool_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Pool not found")
        return {"message": "Pool deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Chemical calculation endpoints
@api_router.post("/calculate", response_model=CalculationResult)
async def calculate_chemical(request: CalculationRequest):
    try:
        if request.calculation_type == "chlorine":
            return calculate_chlorine(request)
        elif request.calculation_type == "ph":
            return calculate_ph(request)
        elif request.calculation_type == "alkalinity":
            return calculate_alkalinity(request)
        elif request.calculation_type == "cyanuric_acid":
            return calculate_cyanuric_acid(request)
        else:
            raise HTTPException(status_code=400, detail="Unknown calculation type")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Calculation functions
def calculate_chlorine(request: CalculationRequest):
    """Calculate chlorine dosage based on current and target levels"""
    volume_liters = request.pool_volume_liters
    current_ppm = request.current_value
    target_ppm = request.target_value
    product_type = request.product_type
    
    # Set default concentrations based on product type
    default_concentrations = {
        "hipoclorito_sodio": 10.0,  # Typical household bleach 10-12%
        "hipoclorito_calcio": 65.0,  # Cal-Hypo 65-70%
        "dicloro_granulado": 56.0,   # Dichlor 56%
        "tricloro_granulado": 90.0,  # Trichlor 90%
        "tricloro_pastillas": 90.0   # Trichlor tablets 90%
    }
    
    concentration = request.product_concentration or default_concentrations.get(product_type, 10.0)

    if target_ppm <= current_ppm:
        return CalculationResult(
            amount=0,
            unit="ml" if product_type == "hipoclorito_sodio" else "g",
            notes="El nivel actual ya está en o por encima del objetivo",
            calculation_details={
                "current": current_ppm,
                "target": target_ppm,
                "difference": 0
            }
        )

    ppm_increase = target_ppm - current_ppm

    # Corrected formula: (ppm_increase * volume_liters) / (1000 * concentration_decimal)
    # This is the standard pool chemical calculation formula
    concentration_decimal = concentration / 100
    amount = (ppm_increase * volume_liters) / (1000 * concentration_decimal)

    # Unit selection and conversion
    if product_type == "hipoclorito_sodio":
        unit = "ml"
        # Convert to liters if amount is large
        if amount > 1000:
            amount = round(amount / 1000, 2)
            unit = "L"
        else:
            amount = round(amount, 2)
    else:
        unit = "g"
        # Convert to kg if amount is large
        if amount > 1000:
            amount = round(amount / 1000, 2)
            unit = "kg"
        else:
            amount = round(amount, 2)

    notes = f"Agregar {amount} {unit} de {get_product_name(product_type)}"

    return CalculationResult(
        amount=amount,
        unit=unit,
        notes=notes,
        calculation_details={
            "current": current_ppm,
            "target": target_ppm,
            "increase": ppm_increase,
            "volume": volume_liters,
            "concentration": concentration,
            "formula_used": "Standard pool chemical formula: (ppm_increase * volume_L) / (1000 * concentration_decimal)"
        }
    )

def calculate_ph(request: CalculationRequest):
    """Calculate pH adjustment dosage"""
    volume_liters = request.pool_volume_liters
    current_ph = request.current_value
    target_ph = request.target_value
    product_type = request.product_type

    if abs(target_ph - current_ph) < 0.1:
        return CalculationResult(
            amount=0,
            unit="g",
            notes="El pH ya está en el rango objetivo",
            calculation_details={"current": current_ph, "target": target_ph}
        )

    ph_change = target_ph - current_ph

    # Improved calculation factors based on standard pool chemistry
    # These factors are grams or ml per 10,000 gallons to change pH by 0.2 units
    if ph_change > 0:  # Increase pH
        if product_type == "carbonato_sodio":
            # Sodium carbonate (soda ash): ~6 oz (170g) per 10,000 gal for 0.2 pH increase
            factor_per_10k_gal = 170.0  # grams per 10,000 gallons for 0.2 pH increase
        else:
            factor_per_10k_gal = 170.0
    else:  # Decrease pH
        if product_type == "acido_muriatico":
            # Muriatic acid: ~1 qt (946ml) per 10,000 gal for 0.2 pH decrease
            factor_per_10k_gal = 946.0  # ml per 10,000 gallons for 0.2 pH decrease
        elif product_type == "bisulfato_sodio":
            # Sodium bisulfate: ~1.5 lbs (680g) per 10,000 gal for 0.2 pH decrease
            factor_per_10k_gal = 680.0  # grams per 10,000 gallons for 0.2 pH decrease
        else:
            factor_per_10k_gal = 680.0

    # Convert volume to gallons for calculation
    volume_gallons = volume_liters * 0.264172
    
    # Calculate amount based on standard pool chemistry formulas
    # Formula: (volume_gallons / 10000) * (ph_change / 0.2) * factor
    amount = (volume_gallons / 10000) * (abs(ph_change) / 0.2) * factor_per_10k_gal

    unit = "ml" if product_type == "acido_muriatico" else "g"

    # Convert to larger units if needed
    if unit == "g" and amount > 1000:
        amount = round(amount / 1000, 2)
        unit = "kg"
    elif unit == "ml" and amount > 1000:
        amount = round(amount / 1000, 2)
        unit = "L"
    else:
        amount = round(amount, 2)

    action = "subir" if ph_change > 0 else "bajar"
    notes = f"Agregar {amount} {unit} de {get_product_name(product_type)} para {action} el pH"

    return CalculationResult(
        amount=amount,
        unit=unit,
        notes=notes,
        calculation_details={
            "current": current_ph,
            "target": target_ph,
            "change": ph_change,
            "volume_liters": volume_liters,
            "volume_gallons": round(volume_gallons, 2),
            "formula_used": f"Pool standard: ({round(volume_gallons,0)}/10000) * ({abs(ph_change)}/0.2) * {factor_per_10k_gal}"
        }
    )

def calculate_alkalinity(request: CalculationRequest):
    """Calculate alkalinity adjustment dosage"""
    volume_liters = request.pool_volume_liters
    current_alk = request.current_value
    target_alk = request.target_value
    product_type = request.product_type

    if target_alk <= current_alk:
        return CalculationResult(
            amount=0,
            unit="g",
            notes="La alcalinidad actual ya está en o por encima del objetivo",
            calculation_details={"current": current_alk, "target": target_alk}
        )

    alk_increase = target_alk - current_alk

    # Standard alkalinity calculation: 1.5 lbs per 10,000 gallons increases alkalinity by 10 ppm
    # 1.5 lbs = 680 grams
    volume_gallons = volume_liters * 0.264172
    
    if product_type == "bicarbonato_sodio":
        # Sodium bicarbonate: 1.5 lbs (680g) per 10,000 gal for 10 ppm increase
        factor_per_10k_gal_per_10ppm = 680.0
    else:  # "aumentador_alcalinidad" - commercial alkalinity increaser
        # Commercial products are typically more concentrated, use ~85% efficiency
        factor_per_10k_gal_per_10ppm = 580.0

    # Calculate amount: (volume_gallons / 10000) * (alk_increase / 10) * factor
    amount = (volume_gallons / 10000) * (alk_increase / 10) * factor_per_10k_gal_per_10ppm

    unit = "g"

    if amount > 1000:
        amount = round(amount / 1000, 2)
        unit = "kg"
    else:
        amount = round(amount, 2)

    notes = f"Agregar {amount} {unit} de {get_product_name(product_type)}"

    return CalculationResult(
        amount=amount,
        unit=unit,
        notes=notes,
        calculation_details={
            "current": current_alk,
            "target": target_alk,
            "increase": alk_increase,
            "volume_liters": volume_liters,
            "volume_gallons": round(volume_gallons, 2),
            "formula_used": f"Pool standard: ({round(volume_gallons,0)}/10000) * ({alk_increase}/10) * {factor_per_10k_gal_per_10ppm}g"
        }
    )

def calculate_cyanuric_acid(request: CalculationRequest):
    """Calculate cyanuric acid adjustment"""
    volume_liters = request.pool_volume_liters
    current_cya = request.current_value
    target_cya = request.target_value
    product_type = request.product_type

    cya_change = target_cya - current_cya

    if product_type == "dilucion_agua":
        if cya_change >= 0:
            return CalculationResult(
                amount=0,
                unit="L",
                notes="Para reducir CYA se requiere dilución. No se puede aumentar con este método.",
                calculation_details={"current": current_cya, "target": target_cya}
            )

        # Calculate water replacement percentage needed
        reduction_percentage = abs(cya_change) / current_cya
        water_to_replace = volume_liters * reduction_percentage

        return CalculationResult(
            amount=round(water_to_replace, 2),
            unit="L",
            notes=f"Reemplazar {round(water_to_replace, 2)} L de agua (aprox {round(reduction_percentage * 100, 1)}% del volumen total)",
            calculation_details={
                "current": current_cya,
                "target": target_cya,
                "reduction_needed": abs(cya_change),
                "volume": volume_liters,
                "replacement_percentage": reduction_percentage
            }
        )

    else:  # acido_cianurico
        if cya_change <= 0:
            return CalculationResult(
                amount=0,
                unit="g",
                notes="El CYA actual ya está en o por encima del objetivo",
                calculation_details={"current": current_cya, "target": target_cya}
            )

        # Factor for CYA increase (grams per 1000L per 10ppm)
        factor = 13.0

        amount = (volume_liters / 1000) * (cya_change / 10) * factor

        unit = "g"

        if amount > 1000:
            amount = round(amount / 1000, 2)
            unit = "kg"
        else:
            amount = round(amount, 2)

        notes = f"Agregar {amount} {unit} de ácido cianúrico granulado"

        return CalculationResult(
            amount=amount,
            unit=unit,
            notes=notes,
            calculation_details={
                "current": current_cya,
                "target": target_cya,
                "increase": cya_change,
                "volume": volume_liters
            }
        )

def get_product_name(product_type: str) -> str:
    """Get human-readable product name"""
    names = {
        "hipoclorito_sodio": "hipoclorito de sodio líquido",
        "hipoclorito_calcio": "hipoclorito de calcio granulado",
        "dicloro_granulado": "dicloro granulado",
        "tricloro_granulado": "tricloro granulado",
        "tricloro_pastillas": "pastillas de tricloro",
        "carbonato_sodio": "carbonato de sodio (soda ash)",
        "acido_muriatico": "ácido muriático",
        "bisulfato_sodio": "bisulfato de sodio",
        "bicarbonato_sodio": "bicarbonato de sodio",
        "aumentador_alcalinidad": "aumentador de alcalinidad",
        "acido_cianurico": "ácido cianúrico",
        "dilucion_agua": "dilución con agua nueva"
    }
    return names.get(product_type, product_type)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
