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
  CheckSquare, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  User,
  Zap,
  RotateCcw
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DailyChecklist() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  });

  const checklist = useQuery(api.dailyChecklists.getWeeklyChecklist, { 
    week_start: currentWeek 
  });
  const initializeChecklist = useMutation(api.dailyChecklists.initializeWeeklyChecklist);
  const updateTask = useMutation(api.dailyChecklists.updateTaskCompletion);
  const addTask = useMutation(api.dailyChecklists.addCustomTask);
  const removeTask = useMutation(api.dailyChecklists.removeTask);

  const [newTaskName, setNewTaskName] = useState("");
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
        task_category: "Custom",
        is_required: false,
      },
    });
    
    setNewTaskName("");
  };

  const getCompletionStats = () => {
    if (!checklist) return { completed: 0, total: 0, required: 0 };
    
    let completed = 0;
    let total = 0;
    let requiredCompleted = 0;
    let requiredTotal = 0;

    checklist.tasks.forEach(task => {
      DAYS.forEach(day => {
        total++;
        if (task.is_required) requiredTotal++;
        
        if (task[day]) {
          completed++;
          if (task.is_required) requiredCompleted++;
        }
      });
    });

    return { 
      completed, 
      total, 
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      requiredPercentage: requiredTotal > 0 ? Math.round((requiredCompleted / requiredTotal) * 100) : 0,
      requiredCompleted,
      requiredTotal
    };
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
          <h1 className="text-3xl font-bold text-foreground">Daily Checklist</h1>
          <p className="text-muted-foreground">
            Track and manage your daily operational tasks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User Initials */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold">
                {userInitials || <User className="h-4 w-4" />}
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
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
                <p className="text-sm font-medium text-muted-foreground">Required Tasks</p>
                <p className="text-2xl font-bold text-foreground">{stats.requiredPercentage}%</p>
                <p className="text-xs text-muted-foreground">{stats.requiredCompleted} of {stats.requiredTotal} done</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Target className="h-6 w-6" />
              </div>
            </div>
            <Progress value={stats.requiredPercentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground">5</p>
                <p className="text-xs text-muted-foreground">Days in a row</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Checklist */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Weekly Task Matrix
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
                      <th className="text-left p-4 font-semibold text-foreground min-w-[200px]">Task</th>
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
                    {checklist?.tasks.map((task, taskIndex) => (
                      <motion.tr
                        key={taskIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: taskIndex * 0.05 }}
                        className={cn(
                          "border-b hover:bg-muted/30 transition-colors",
                          task.is_required && "bg-amber-500/5"
                        )}
                      >
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {task.task_name}
                              </span>
                              {task.is_required && (
                                <Badge variant="outline" size="sm" className="text-xs border-amber-500 text-amber-700 dark:text-amber-300">
                                  Required
                                </Badge>
                              )}
                            </div>
                            {task.task_category && (
                              <p className="text-xs text-muted-foreground">{task.task_category}</p>
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
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
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
                    ))}
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
                          <p className="text-xs text-muted-foreground">{task.task_category}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.is_required && (
                          <Badge variant="outline" size="sm">Required</Badge>
                        )}
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
                              task[day] && "bg-emerald-600 hover:bg-emerald-700"
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
                placeholder="Add a new custom task..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1"
              />
              <Button onClick={handleAddTask} disabled={!newTaskName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Required tasks are highlighted and must be completed daily for compliance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}