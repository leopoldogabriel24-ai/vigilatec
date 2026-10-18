# Progreso semanal del estudiante (para las gráficas).
from collections import OrderedDict
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..modelos import Distraccion, SesionEstudio
from .ranking import ZONA, utc


def progreso_semanal(bd: Session, filtro_dueno, semanas: int) -> list[dict]:
    hoy = datetime.now(ZONA).date()
    lunes_actual = hoy - timedelta(days=hoy.weekday())
    lunes = [lunes_actual - timedelta(weeks=i) for i in range(semanas - 1, -1, -1)]
    datos = OrderedDict((l, {"semana": l.isoformat(), "sesiones": 0, "seg_total": 0, "seg_conc": 0, "distracciones": 0}) for l in lunes)

    desde = datetime.combine(lunes[0], datetime.min.time(), tzinfo=ZONA)
    conteo = select(Distraccion.sesion_id, func.count().label("n")).group_by(Distraccion.sesion_id).subquery()
    consulta = (
        select(SesionEstudio.fecha, SesionEstudio.duracion_real, SesionEstudio.tiempo_concentrado, func.coalesce(conteo.c.n, 0))
        .outerjoin(conteo, conteo.c.sesion_id == SesionEstudio.id)
        .where(filtro_dueno, SesionEstudio.fecha >= desde)
    )
    for fecha, total, concentrado, distr in bd.execute(consulta):
        dia = utc(fecha).astimezone(ZONA).date()
        semana = datos.get(dia - timedelta(days=dia.weekday()))
        if semana:
            semana["sesiones"] += 1
            semana["seg_total"] += total
            semana["seg_conc"] += concentrado
            semana["distracciones"] += distr

    return [
        {
            "semana": d["semana"], "sesiones": d["sesiones"],
            "minutos_totales": d["seg_total"] // 60, "minutos_concentrados": d["seg_conc"] // 60,
            "distracciones": d["distracciones"],
            "porcentaje": round(100 * d["seg_conc"] / d["seg_total"], 1) if d["seg_total"] else 0.0,
        }
        for d in datos.values()
    ]
