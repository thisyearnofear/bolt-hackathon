import { ABlock } from '../lib/ABlock';
import './ContestantInfo.css';

interface ContestantInfoProps {
    block?: ABlock;
}

export function ContestantInfo({ block }: ContestantInfoProps) {
    if (!block?.contestant) return null;

    const { contestant } = block;

    return (
        <div className="contestant-info">
            <div className="contestant-info__header">
                <h2>{contestant.teamName}</h2>
                <span className="contestant-info__track">{contestant.track}</span>
            </div>
            
            <div className="contestant-info__content">
                <div className="contestant-info__section">
                    <h3>Project</h3>
                    <p>{contestant.project}</p>
                </div>
                
                <div className="contestant-info__section">
                    <h3>Description</h3>
                    <p>{contestant.description}</p>
                </div>
                
                <div className="contestant-info__meta">
                    <div>
                        <span>Team Size</span>
                        <strong>{contestant.members}</strong>
                    </div>
                    <div>
                        <span>Progress</span>
                        <div className="progress-bar">
                            <div 
                                className="progress-bar__fill"
                                style={{ width: `${contestant.progress * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
