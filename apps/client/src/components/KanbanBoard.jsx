import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * Reusable Kanban Board Component
 * Linear & Stripe Standard - Executive, High-Contrast & Tactile
 */
const KanbanBoard = ({ columns, data, onDragEnd, renderCard, loading, layout = 'horizontal' }) => {
    
    // Sort items into columns
    const boardData = columns.reduce((acc, col) => {
        acc[col.id] = data.filter(item => item.status === col.id);
        return acc;
    }, {});

    if (loading) return null;

    const getColumnDotColor = (colId) => {
        switch(colId) {
            case 'Pending': return 'bg-slate-400';
            case 'In Progress': return 'bg-indigo-500';
            case 'Completed': return 'bg-emerald-500';
            case 'Cancelled': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    const getColumnAccent = (colId) => {
        switch(colId) {
            case 'Pending': return 'bg-slate-400';
            case 'In Progress': return 'bg-indigo-600';
            case 'Completed': return 'bg-emerald-600';
            case 'Cancelled': return 'bg-rose-600';
            default: return 'bg-slate-400';
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className={`
                ${layout === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto flex-1 h-full content-start' 
                    : 'flex flex-1 overflow-x-auto gap-6 h-full items-start'
                }
            `}>
                {columns.map((column) => (
                    <div 
                        key={column.id} 
                        className={`
                            flex flex-col bg-white border border-slate-200/90 shadow-2xs rounded-2xl overflow-hidden
                            ${layout === 'grid' ? 'h-full min-h-[460px]' : 'min-w-[320px] w-80 max-h-full'}
                        `}
                    >
                        {/* Column Top Colored Accent Line */}
                        <div className={`h-1.5 w-full ${getColumnAccent(column.id)}`} />

                        {/* Executive Column Header */}
                        <div className="p-4 border-b border-slate-200/80 bg-white sticky top-0 z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${getColumnDotColor(column.id)}`} />
                                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                                    {column.title}
                                </h3>
                            </div>

                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200/80">
                                {boardData[column.id]?.length || 0}
                            </span>
                        </div>

                        {/* Droppable Stage Area */}
                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 overflow-y-auto p-4 space-y-3.5 transition-colors duration-200 min-h-[200px] ${
                                        snapshot.isDraggingOver ? 'bg-slate-100/60' : 'bg-slate-50/40'
                                    }`}
                                >
                                    {boardData[column.id]?.length === 0 && !snapshot.isDraggingOver && (
                                        <div className="h-44 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1.5 m-1">
                                            <span className="text-xs font-extrabold uppercase tracking-wider">Empty Stage</span>
                                            <span className="text-[11px] font-medium text-slate-400">Drag items here</span>
                                        </div>
                                    )}

                                    {boardData[column.id]?.map((item, index) => (
                                        <Draggable key={item._id} draggableId={item._id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style }}
                                                    className={`
                                                        bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs transition-all group relative cursor-grab active:cursor-grabbing
                                                        hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5
                                                        ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-slate-900 ring-4 ring-slate-900/10 z-50 bg-white/95 backdrop-blur-md' : ''}
                                                    `}
                                                >
                                                    {renderCard(item)}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
};

export default KanbanBoard;
