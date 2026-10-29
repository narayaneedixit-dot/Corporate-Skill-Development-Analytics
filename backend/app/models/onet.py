from sqlalchemy import Column, BigInteger, Text, Boolean
from backend.app.db.database import Base


class OnetSoftwareSkill(Base):
    __tablename__ = "onet_software_skills"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, index=True)
    onet_soc_code = Column(Text, index=True, nullable=True)
    occupation_title = Column(Text, index=True, nullable=True)
    software_example = Column(Text, index=True, nullable=True)
    element_id = Column(Text, nullable=True)
    software_category = Column(Text, index=True, nullable=True)
    hot_technology = Column(Boolean, index=True, default=False, nullable=True)
    in_demand = Column(Boolean, index=True, default=False, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "onet_soc_code": self.onet_soc_code,
            "occupation_title": self.occupation_title,
            "software_example": self.software_example,
            "element_id": self.element_id,
            "software_category": self.software_category,
            "hot_technology": bool(self.hot_technology),
            "in_demand": bool(self.in_demand)
        }
