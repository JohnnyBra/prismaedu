import React from 'react';
import { Task } from '../types';
import { CheckCircle, Star, Zap } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  completed?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, completed }) => {
  const isSchool = task.context === 'SCHOOL';

  return (
    <div className={`
      group relative glass rounded-2xl p-4 transition-all duration-300
      ${isSchool ? 'glow-border-blue hover:shadow-neon-blue' : 'glow-border-orange hover:shadow-neon-orange'}
      ${completed ? 'opacity-40' : 'hover:-translate-y-1'}
    `}>
      {/* Context accent line */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${isSchool ? 'bg-primary-500' : 'bg-secondary-500'}`} />

      {task.isPriority && !completed && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce-subtle z-10">
          <Zap size={10} fill="currentColor" /> PRIORIDAD
        </div>
      )}

      <div className="flex items-center justify-between pl-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2.5 rounded-xl transition-colors duration-300 ${
            isSchool
              ? 'bg-primary-500/15 text-primary-400 group-hover:bg-primary-500/25'
              : 'bg-secondary-500/15 text-secondary-400 group-hover:bg-secondary-500/25'
          }`}>
            <Star size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-white/90 text-sm truncate">{task.title}</h3>
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
              isSchool
                ? 'bg-primary-500/15 text-primary-300'
                : 'bg-secondary-500/15 text-secondary-300'
            }`}>
              {isSchool ? 'Colegio' : 'Casa'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
          <span className="font-display font-bold text-lg bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
            +{task.points}
          </span>
          {!completed ? (
            <button
              onClick={onComplete}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold
                transition-all duration-200 active:scale-95 shadow-lg
                ${isSchool
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-primary-500/25'
                  : 'bg-gradient-to-r from-secondary-600 to-secondary-500 hover:from-secondary-500 hover:to-secondary-400 shadow-secondary-500/25'
                }
              `}
            >
              <CheckCircle size={14} /> Hecho
            </button>
          ) : (
            <span className="flex items-center text-emerald-400 text-xs font-semibold gap-1">
              <CheckCircle size={14} /> Hecho
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
