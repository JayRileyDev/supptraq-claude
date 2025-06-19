import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  ClipboardList, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Home,
  DollarSign,
  Package,
  Megaphone,
  Check
} from "lucide-react";
import { cn } from "~/lib/utils";

const CATEGORY_ICONS: Record<string, any> = {
  "Housekeeping": Home,
  "Finance": DollarSign,
  "Operations": Package,
  "Marketing": Megaphone,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Housekeeping": "bg-blue-100 text-blue-700 border-blue-200",
  "Finance": "bg-green-100 text-green-700 border-green-200",
  "Operations": "bg-purple-100 text-purple-700 border-purple-200",
  "Marketing": "bg-orange-100 text-orange-700 border-orange-200",
};

export default function DLChecklist() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const checklist = useQuery(api.dlChecklists.getMonthlyChecklist, { 
    month: currentMonth 
  });
  const initializeChecklist = useMutation(api.dlChecklists.initializeMonthlyChecklist);
  const toggleTask = useMutation(api.dlChecklists.toggleTaskCompletion);
  const addTask = useMutation(api.dlChecklists.addTask);
  const removeTask = useMutation(api.dlChecklists.removeTask);

  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [userInitials, setUserInitials] = useState(() => {
    return localStorage.getItem("userInitials") || "";
  });

  useEffect(() => {
    if (userInitials) {
      localStorage.setItem("userInitials", userInitials);
    }
  }, [userInitials]);

  useEffect(() => {
    // Initialize checklist if it doesn't exist
    if (checklist === null) {
      initializeChecklist({ month: currentMonth });
    }
  }, [checklist, currentMonth, initializeChecklist]);

  const navigateMonth = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getDayOfWeek = (day: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short' })[0];
  };

  const isTaskCompletedOnDate = (task: any, dateStr: string) => {
    return task.completed_dates.some((cd: any) => cd.date === dateStr);
  };

  const handleTaskToggle = async (categoryIndex: number, taskIndex: number, day: number) => {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    
    await toggleTask({
      month: currentMonth,
      category_index: categoryIndex,
      task_index: taskIndex,
      date: dateStr,
      completed_by: userInitials || "✓",
    });
  };

  const handleAddTask = async (categoryName: string) => {
    const taskName = newTaskInputs[categoryName];
    if (!taskName?.trim()) return;
    
    await addTask({
      month: currentMonth,
      category_name: categoryName,
      task_name: taskName,
    });
    
    setNewTaskInputs(prev => ({ ...prev, [categoryName]: "" }));
  };

  const getCategoryStats = (category: any) => {
    const totalTasks = category.tasks.length;
    const daysInMonth = getDaysInMonth();
    const totalPossible = totalTasks * daysInMonth;
    
    let completed = 0;
    category.tasks.forEach((task: any) => {
      completed += task.completed_dates.filter((cd: any) => 
        cd.date.startsWith(currentMonth)
      ).length;
    });
    
    return {
      completed,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0
    };
  };

  const getOverallStats = () => {
    if (!checklist) return { completed: 0, total: 0, percentage: 0 };
    
    let totalCompleted = 0;
    let totalPossible = 0;
    
    checklist.categories.forEach(category => {
      const stats = getCategoryStats(category);
      totalCompleted += stats.completed;
      totalPossible += stats.total;
    });
    
    return {
      completed: totalCompleted,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
    };
  };

  const overallStats = getOverallStats();
  const daysInMonth = getDaysInMonth();

  if (checklist === undefined) {
    return <div className="p-8">Loading checklist...</div>;
  }

  if (checklist === null) {
    return <div className="p-8">Initializing checklist...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">District Lead Checklist</h1>
          <p className="mt-2 text-gray-600">
            Monthly audit and oversight tasks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Input
              placeholder="Your initials"
              value={userInitials}
              onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
              className="w-24 text-center"
              maxLength={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[150px] text-center font-medium">
              {formatMonth()}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Monthly Progress</h3>
              <p className="text-3xl font-bold mt-2">{overallStats.percentage}%</p>
              <p className="text-sm text-gray-500">
                {overallStats.completed} of {overallStats.total} tasks completed
              </p>
            </div>
            <ClipboardList className="h-12 w-12 text-gray-400" />
          </div>
          <div className="mt-4 h-3 rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
              style={{ width: `${overallStats.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Sections */}
      <div className="space-y-8">
        {checklist?.categories.map((category, categoryIndex) => {
          const Icon = CATEGORY_ICONS[category.category_name] || ClipboardList;
          const stats = getCategoryStats(category);
          
          return (
            <Card key={categoryIndex} className="overflow-hidden">
              <CardHeader className={cn(
                "border-b",
                CATEGORY_COLORS[category.category_name] || "bg-gray-100"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <CardTitle>{category.category_name}</CardTitle>
                  </div>
                  <div className="text-sm font-medium">
                    {stats.percentage}% Complete ({stats.completed}/{stats.total})
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="sticky left-0 bg-gray-50 p-3 text-left font-medium">
                          Task
                        </th>
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <th key={i} className="min-w-[40px] p-1 text-center text-xs">
                            <div>{i + 1}</div>
                            <div className="text-gray-400">{getDayOfWeek(i + 1)}</div>
                          </th>
                        ))}
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.tasks.map((task, taskIndex) => (
                        <tr key={taskIndex} className="border-b hover:bg-gray-50">
                          <td className="sticky left-0 bg-white p-3 font-medium">
                            {task.task_name}
                          </td>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                            const isCompleted = isTaskCompletedOnDate(task, dateStr);
                            const completedBy = task.completed_dates.find(
                              (cd: any) => cd.date === dateStr
                            )?.completed_by;
                            
                            return (
                              <td key={i} className="p-1 text-center">
                                <Button
                                  variant={isCompleted ? "default" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    isCompleted && "bg-green-600 hover:bg-green-700"
                                  )}
                                  onClick={() => handleTaskToggle(categoryIndex, taskIndex, day)}
                                  title={completedBy ? `Completed by ${completedBy}` : ""}
                                >
                                  {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <span className="text-xs text-gray-400">{day}</span>
                                  )}
                                </Button>
                              </td>
                            );
                          })}
                          <td className="p-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeTask({
                                month: currentMonth,
                                category_index: categoryIndex,
                                task_index: taskIndex,
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add new task */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add new ${category.category_name.toLowerCase()} task...`}
                      value={newTaskInputs[category.category_name] || ""}
                      onChange={(e) => setNewTaskInputs(prev => ({
                        ...prev,
                        [category.category_name]: e.target.value
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddTask(category.category_name);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleAddTask(category.category_name)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}