import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { 
  Shield, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Package
} from "lucide-react";
import { cn } from "~/lib/utils";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SLChecklist() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Get the Monday of the current week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const checklist = useQuery(api.slChecklists.getWeeklyChecklist, { 
    week_start: currentWeek 
  });
  const initializeChecklist = useMutation(api.slChecklists.initializeWeeklyChecklist);
  const updateTask = useMutation(api.slChecklists.updateTaskCompletion);
  const addTask = useMutation(api.slChecklists.addCustomTask);
  const removeTask = useMutation(api.slChecklists.removeTask);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
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
      initializeChecklist({ week_start: currentWeek });
    }
  }, [checklist, currentWeek, initializeChecklist]);

  const navigateWeek = (direction: number) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + (direction * 7));
    setCurrentWeek(date.toISOString().split('T')[0]);
  };

  const formatWeekRange = () => {
    const start = new Date(currentWeek);
    const end = new Date(currentWeek);
    end.setDate(end.getDate() + 6);
    
    const format = (d: Date) => d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${format(start)} - ${format(end)}, ${start.getFullYear()}`;
  };

  const handleTaskToggle = async (taskIndex: number, day: typeof DAYS[number]) => {
    if (!checklist) return;
    
    const task = checklist.tasks[taskIndex];
    const currentValue = task[day];
    
    await updateTask({
      week_start: currentWeek,
      task_index: taskIndex,
      day,
      initials: currentValue ? undefined : userInitials || "✓",
    });
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) return;
    
    await addTask({
      week_start: currentWeek,
      task: {
        task_name: newTaskName,
        task_category: newTaskCategory || "Custom",
      },
    });
    
    setNewTaskName("");
    setNewTaskCategory("");
  };

  const getCompletionStats = () => {
    if (!checklist) return { completed: 0, total: 0 };
    
    let completed = 0;
    let total = 0;

    checklist.tasks.forEach(task => {
      DAYS.forEach(day => {
        total++;
        if (task[day]) {
          completed++;
        }
      });
    });

    return { 
      completed, 
      total, 
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const getCategoryStats = () => {
    if (!checklist) return {};
    
    const stats: Record<string, { completed: number; total: number }> = {};
    
    checklist.tasks.forEach(task => {
      const category = task.task_category || "Other";
      if (!stats[category]) {
        stats[category] = { completed: 0, total: 0 };
      }
      
      DAYS.forEach(day => {
        stats[category].total++;
        if (task[day]) {
          stats[category].completed++;
        }
      });
    });
    
    return stats;
  };

  const stats = getCompletionStats();
  const categoryStats = getCategoryStats();
  
  const isToday = (day: typeof DAYS[number]) => {
    const today = new Date();
    const weekDay = today.getDay();
    const todayIndex = weekDay === 0 ? 6 : weekDay - 1;
    return DAYS[todayIndex] === day;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Communication": "bg-blue-100 text-blue-700",
      "Inventory": "bg-green-100 text-green-700",
      "Team Management": "bg-purple-100 text-purple-700",
      "Training": "bg-yellow-100 text-yellow-700",
      "Operations": "bg-orange-100 text-orange-700",
      "Customer Service": "bg-pink-100 text-pink-700",
    };
    return colors[category || ""] || "bg-gray-100 text-gray-700";
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Store Lead Checklist</h1>
          <p className="mt-2 text-gray-600">
            Weekly management tasks for store leadership
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
              onClick={() => navigateWeek(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[200px] text-center font-medium">
              {formatWeekRange()}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateWeek(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overall Completion</p>
                <p className="text-2xl font-bold">{stats.percentage}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-purple-600 transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Team Tasks</p>
                <p className="text-2xl font-bold">
                  {categoryStats["Team Management"]?.completed || 0}/
                  {categoryStats["Team Management"]?.total || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inventory Tasks</p>
                <p className="text-2xl font-bold">
                  {categoryStats["Inventory"]?.completed || 0}/
                  {categoryStats["Inventory"]?.total || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tasks Completed</p>
                <p className="text-2xl font-bold">
                  {stats.completed}/{stats.total}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Leadership Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white p-3 text-left">Task</th>
                  {DAY_LABELS.map((day, index) => (
                    <th
                      key={day}
                      className={cn(
                        "min-w-[80px] p-3 text-center",
                        isToday(DAYS[index]) && "bg-purple-50 font-bold text-purple-700"
                      )}
                    >
                      {day}
                    </th>
                  ))}
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {checklist?.tasks.map((task, taskIndex) => (
                  <tr key={taskIndex} className="border-t">
                    <td className="sticky left-0 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.task_name}</span>
                        {task.task_category && (
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", getCategoryColor(task.task_category))}
                          >
                            {task.task_category}
                          </Badge>
                        )}
                      </div>
                    </td>
                    {DAYS.map((day) => (
                      <td
                        key={day}
                        className={cn(
                          "p-3 text-center",
                          isToday(day) && "bg-purple-50"
                        )}
                      >
                        <Button
                          variant={task[day] ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 w-12 text-xs",
                            task[day] && "bg-purple-600 hover:bg-purple-700"
                          )}
                          onClick={() => handleTaskToggle(taskIndex, day)}
                        >
                          {task[day] || "-"}
                        </Button>
                      </td>
                    ))}
                    <td className="p-3">
                      {task.task_category === "Custom" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTask({
                            week_start: currentWeek,
                            task_index: taskIndex,
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add new task */}
          <div className="mt-6 flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Category"
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>💡 Tip: Use categories to organize your leadership tasks for better tracking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}