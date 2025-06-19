import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { 
  Shield, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  Package,
  MessageCircle,
  GraduationCap,
  Settings,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  User,
  Zap,
  RotateCcw,
  Target
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SLChecklist() {
  const [currentWeek, setCurrentWeek] = useState(() => {
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

  const getTodayStats = () => {
    if (!checklist) return { completed: 0, total: 0 };
    
    const today = new Date();
    const weekDay = today.getDay();
    const todayIndex = weekDay === 0 ? 6 : weekDay - 1;
    const todayKey = DAYS[todayIndex];
    
    let completed = 0;
    let total = checklist.tasks.length;
    
    checklist.tasks.forEach(task => {
      if (task[todayKey]) completed++;
    });
    
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const stats = getCompletionStats();
  const categoryStats = getCategoryStats();
  const todayStats = getTodayStats();
  
  const isToday = (day: typeof DAYS[number]) => {
    const today = new Date();
    const weekDay = today.getDay();
    const todayIndex = weekDay === 0 ? 6 : weekDay - 1;
    return DAYS[todayIndex] === day;
  };

  const getCurrentDayName = () => {
    const today = new Date();
    const weekDay = today.getDay();
    const todayIndex = weekDay === 0 ? 6 : weekDay - 1;
    return FULL_DAY_NAMES[todayIndex];
  };

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, any> = {
      "Communication": MessageCircle,
      "Inventory": Package,
      "Team Management": Users,
      "Training": GraduationCap,
      "Operations": Settings,
      "Customer Service": HeartHandshake,
    };
    return icons[category || ""] || Target;
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Communication": "blue",
      "Inventory": "emerald",
      "Team Management": "violet",
      "Training": "amber",
      "Operations": "orange",
      "Customer Service": "pink",
    };
    return colors[category || ""] || "gray";
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800"
      },
      emerald: {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800"
      },
      violet: {
        bg: "bg-violet-500/10 dark:bg-violet-500/20",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-200 dark:border-violet-800"
      },
      amber: {
        bg: "bg-amber-500/10 dark:bg-amber-500/20",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800"
      },
      orange: {
        bg: "bg-orange-500/10 dark:bg-orange-500/20",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800"
      },
      pink: {
        bg: "bg-pink-500/10 dark:bg-pink-500/20",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-200 dark:border-pink-800"
      },
      gray: {
        bg: "bg-gray-500/10 dark:bg-gray-500/20",
        text: "text-gray-600 dark:text-gray-400",
        border: "border-gray-200 dark:border-gray-800"
      }
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  if (checklist === undefined) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (checklist === null) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Initializing checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Store Lead Checklist</h1>
          <p className="text-muted-foreground">
            Weekly leadership and management tasks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User Initials */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                {userInitials || <Shield className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <Input
              placeholder="Initials"
              value={userInitials}
              onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
              className="w-20 text-center text-sm"
              maxLength={3}
            />
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek(-1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center text-sm font-medium px-3">
              {formatWeekRange()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek(1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today ({getCurrentDayName()})</p>
                <p className="text-2xl font-bold text-foreground">{todayStats.percentage}%</p>
                <p className="text-xs text-muted-foreground">{todayStats.completed} of {todayStats.total} tasks</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <Progress value={todayStats.percentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Week Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats.percentage}%</p>
                <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} completed</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <Progress value={stats.percentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Team Management</p>
                <p className="text-2xl font-bold text-foreground">
                  {categoryStats["Team Management"]?.completed || 0}/{categoryStats["Team Management"]?.total || 0}
                </p>
                <p className="text-xs text-muted-foreground">Leadership tasks</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground">7</p>
                <p className="text-xs text-muted-foreground">Days as leader</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Task Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Object.entries(categoryStats).map(([category, data]) => {
              const IconComponent = getCategoryIcon(category);
              const colorKey = getCategoryColor(category);
              const colors = getColorClasses(colorKey);
              const percentage = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              
              return (
                <div key={category} className="text-center space-y-2">
                  <div className={cn("p-3 rounded-xl mx-auto w-fit", colors.bg)}>
                    <IconComponent className={cn("h-5 w-5", colors.text)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{category}</p>
                    <p className="text-xs text-muted-foreground">{data.completed}/{data.total}</p>
                    <Progress value={percentage} className="mt-1 h-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Checklist */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Leadership Task Matrix
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {checklist?.tasks.length || 0} tasks
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden lg:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold text-foreground min-w-[250px]">Task</th>
                      {DAY_LABELS.map((day, index) => (
                        <th
                          key={day}
                          className={cn(
                            "text-center p-4 font-semibold min-w-[100px]",
                            isToday(DAYS[index]) && "bg-primary/5 text-primary"
                          )}
                        >
                          <div className="space-y-1">
                            <div className={cn(
                              "font-semibold",
                              isToday(DAYS[index]) && "text-primary"
                            )}>
                              {day}
                            </div>
                            {isToday(DAYS[index]) && (
                              <Badge variant="outline" size="sm" className="text-xs border-primary text-primary">
                                Today
                              </Badge>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklist?.tasks.map((task, taskIndex) => {
                      const colorKey = getCategoryColor(task.task_category);
                      const colors = getColorClasses(colorKey);
                      
                      return (
                        <motion.tr
                          key={taskIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: taskIndex * 0.05 }}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {task.task_name}
                                </span>
                              </div>
                              {task.task_category && (
                                <Badge 
                                  variant="outline" 
                                  size="sm" 
                                  className={cn("text-xs", colors.border, colors.text)}
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
                                "p-4 text-center",
                                isToday(day) && "bg-primary/5"
                              )}
                            >
                              <Button
                                variant={task[day] ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-9 w-16 text-xs font-medium transition-all",
                                  task[day] 
                                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm" 
                                    : "hover:bg-muted"
                                )}
                                onClick={() => handleTaskToggle(taskIndex, day)}
                              >
                                {task[day] ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span className="text-xs">{task[day]}</span>
                                  </div>
                                ) : (
                                  "Mark"
                                )}
                              </Button>
                            </td>
                          ))}
                          <td className="p-4">
                            {task.task_category === "Custom" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeTask({
                                  week_start: currentWeek,
                                  task_index: taskIndex,
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
              {checklist?.tasks.map((task, taskIndex) => (
                <Card key={taskIndex} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{task.task_name}</h4>
                        {task.task_category && (
                          <Badge variant="outline" size="sm" className="mt-1">
                            {task.task_category}
                          </Badge>
                        )}
                      </div>
                      {task.task_category === "Custom" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask({
                            week_start: currentWeek,
                            task_index: taskIndex,
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {DAYS.map((day, dayIndex) => (
                        <div key={day} className="text-center">
                          <div className={cn(
                            "text-xs font-medium mb-1",
                            isToday(day) && "text-primary"
                          )}>
                            {DAY_LABELS[dayIndex]}
                          </div>
                          <Button
                            variant={task[day] ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-8 w-full text-xs",
                              task[day] && "bg-violet-600 hover:bg-violet-700"
                            )}
                            onClick={() => handleTaskToggle(taskIndex, day)}
                          >
                            {task[day] ? "✓" : "-"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add New Task */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-3">
              <Input
                placeholder="Add a new leadership task..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1"
              />
              <Input
                placeholder="Category"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="w-40"
              />
              <Button onClick={handleAddTask} disabled={!newTaskName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Use categories like "Team Management", "Training", or "Communication" to organize your leadership tasks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}