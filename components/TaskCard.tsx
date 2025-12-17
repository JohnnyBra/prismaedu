import React from 'react';
import { Task } from '../types';
import { CheckCircle, AlertCircle, Star } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  completed?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, completed }) => {
  const isSchool = task.context === 'SCHOOL';
  
  return (
    <div className={`
      relative p-4 rounded-xl border-l-4 shadow-sm transition-all transform hover:scale-[1.02] bg-white
      ${isSchool ? 'border-l-blue-500' : 'border-l-orange-500'}
      ${completed ? 'opacity-50 grayscale' : 'opacity-100'}
    `}>
      {task.isPriority && !completed && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce shadow-md">
          PRIORIDAD
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isSchool ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {/* Lucide icon mapping could go here, generic star for now */}
            <Star size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{task.title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSchool ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {isSchool ? 'Colegio' : 'Casa'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className="font-bold text-xl text-yellow-500 drop-shadow-sm">+{task.points}</span>
          {!completed && (
            <button 
              onClick={onComplete}
              className={`
                p-2 rounded-lg text-white font-medium text-sm flex items-center gap-1 shadow-md active:scale-95 transition-transform
                ${isSchool ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}
              `}
            >
              <CheckCircle size={16} /> Hecho
            </button>
          )}
           {completed && (
            <span className="text-green-600 text-sm font-bold flex items-center">
              <CheckCircle size={14} className="mr-1"/> Hecho
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;