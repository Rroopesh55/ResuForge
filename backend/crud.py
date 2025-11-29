from sqlalchemy.orm import Session
from . import models
import os

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str):
    db_user = models.User(username=username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_resume(db: Session, user_id: int, title: str, original_filepath: str):
    db_resume = models.Resume(user_id=user_id, title=title, original_filepath=original_filepath)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

def create_resume_version(db: Session, resume_id: int, filepath: str, pdf_filepath: str = None, change_summary: str = None):
    # Get last version number
    last_version = db.query(models.ResumeVersion).filter(models.ResumeVersion.resume_id == resume_id).order_by(models.ResumeVersion.version_number.desc()).first()
    new_version_num = (last_version.version_number + 1) if last_version else 1
    
    db_version = models.ResumeVersion(
        resume_id=resume_id,
        version_number=new_version_num,
        filepath=filepath,
        pdf_filepath=pdf_filepath,
        change_summary=change_summary
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version

def get_resumes_by_user(db: Session, user_id: int):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id).all()

def get_resume_versions(db: Session, resume_id: int):
    return db.query(models.ResumeVersion).filter(models.ResumeVersion.resume_id == resume_id).order_by(models.ResumeVersion.version_number.desc()).all()
