import React from 'react';

function ToastAlerts({ alerts, onCloseAlert }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none no-print">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border text-sm transition-all duration-300 transform translate-x-0 ${
            alert.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' :
            alert.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-300' :
            alert.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-300' :
            'bg-slate-900/90 border-slate-700/50 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'warning' && <span>⚠️</span>}
            {alert.type === 'success' && <span>✅</span>}
            {alert.type === 'error' && <span>❌</span>}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => onCloseAlert(alert.id)}
            className="text-slate-400 hover:text-white font-bold text-base"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastAlerts;
