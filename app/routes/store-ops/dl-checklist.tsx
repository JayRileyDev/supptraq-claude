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
  CheckCircle2,
  Building,
  TrendingUp,
  Target,
  Zap,
  RotateCcw,
  Crown
} from "lucide-react";
import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, any> = {
  "Housekeeping": Home,
  "Finance": DollarSign,
  "Operations": Package,
  "Marketing": Megaphone,
  "Regional": Building,
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
    if (checklist === null) {
      initializeChecklist({ month: currentMonth });
    }
  }, [checklist, currentMonth, initializeChecklist]);

  const navigateMonth = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleToggleTask = async (categoryIndex: number, taskIndex: number) => {
    await toggleTask({
      month: currentMonth,
      category_index: categoryIndex,
      task_index: taskIndex,
      completed_by: userInitials || "DL",
    });
  };

  const handleAddTask = async (categoryIndex: number, category: string) => {
    const newTaskText = newTaskInputs[category];
    if (!newTaskText?.trim()) return;
    
    await addTask({
      month: currentMonth,
      category_index: categoryIndex,
      task_text: newTaskText.trim(),
    });
    
    setNewTaskInputs(prev => ({ ...prev, [category]: "" }));
  };

  const getCompletionStats = () => {
    if (!checklist) return { completed: 0, total: 0, percentage: 0 };
    
    let completed = 0;
    let total = 0;

    checklist.categories.forEach(category => {
      category.tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
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
    
    const stats: Record<string, { completed: number; total: number; percentage: number }> = {};
    
    checklist.categories.forEach(category => {
      let completed = 0;
      let total = category.tasks.length;
      
      category.tasks.forEach(task => {
        if (task.completed) completed++;
      });
      
      stats[category.category_name] = {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });
    
    return stats;
  };

  const getColorClasses = (category: string) => {
    const colors = {
      "Housekeeping": {
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800"
      },
      "Finance": {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800"
      },
      "Operations": {
        bg: "bg-violet-500/10 dark:bg-violet-500/20",
        text: "text-violet-600 dark:text-violet-400",
        border: "border-violet-200 dark:border-violet-800"
      },
      "Marketing": {
        bg: "bg-orange-500/10 dark:bg-orange-500/20",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800"
      },
      "Regional": {
        bg: "bg-pink-500/10 dark:bg-pink-500/20",
        text: "text-pink-600 dark:text-pink-400",
        border: "border-pink-200 dark:border-pink-800"
      }
    };
    return colors[category as keyof typeof colors] || {
      bg: "bg-gray-500/10 dark:bg-gray-500/20",
      text: "text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-800"
    };
  };

  const stats = getCompletionStats();
  const categoryStats = getCategoryStats();

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
          <h1 className="text-3xl font-bold text-foreground">District Lead Checklist</h1>
          <p className="text-muted-foreground">
            Monthly strategic and oversight tasks
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* User Initials */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                {userInitials || <Crown className="h-4 w-4" />}
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
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium px-3">
              {formatMonth()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth(1)}
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
                <p className="text-sm font-medium text-muted-foreground">Monthly Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats.percentage}%</p>
                <p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} completed</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <Progress value={stats.percentage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(categoryStats).length}</p>
                <p className="text-xs text-muted-foreground">Active areas</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Operations</p>
                <p className="text-2xl font-bold text-foreground">
                  {categoryStats["Operations"]?.percentage || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Ops tasks done</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold text-foreground">3</p>
                <p className="text-xs text-muted-foreground">Months leading</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Overview */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Category Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryStats).map(([category, data]) => {
              const IconComponent = CATEGORY_ICONS[category] || Target;
              const colors = getColorClasses(category);
              
              return (
                <div key={category} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className={cn("p-3 rounded-xl", colors.bg)}>
                    <IconComponent className={cn("h-5 w-5", colors.text)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-foreground">{category}</p>
                      <span className="text-sm text-muted-foreground">{data.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={data.percentage} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground">{data.completed}/{data.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Categories */}
      <div className="space-y-6">
        {checklist?.categories.map((category, categoryIndex) => {
          const IconComponent = CATEGORY_ICONS[category.category_name] || ClipboardList;
          const colors = getColorClasses(category.category_name);
          const categoryComplete = category.tasks.every(task => task.completed);
          
          return (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colors.bg)}>
                      <IconComponent className={cn("h-5 w-5", colors.text)} />
                    </div>
                    <div>
                      <span className="text-lg font-semibold text-foreground">
                        {category.category_name}
                      </span>
                      {categoryComplete && (
                        <Badge variant="outline" size="sm" className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {categoryStats[category.category_name]?.completed || 0} / {category.tasks.length} tasks
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.tasks.map((task, taskIndex) => (
                    <motion.div
                      key={taskIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: taskIndex * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
                        task.completed ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" : "bg-background hover:bg-muted/30"
                      )}
                    >
                      <Button
                        variant={task.completed ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-full",
                          task.completed && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        onClick={() => handleToggleTask(categoryIndex, taskIndex)}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border-2 border-muted-foreground" />
                        )}
                      </Button>
                      
                      <div className="flex-1">
                        <p className={cn(
                          "text-sm font-medium",
                          task.completed ? "line-through text-muted-foreground" : "text-foreground"
                        )}>
                          {task.task_text}
                        </p>
                        {task.completed && task.completed_by && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed by {task.completed_by}
                          </p>
                        )}
                      </div>

                      {task.is_custom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeTask({
                            month: currentMonth,
                            category_index: categoryIndex,
                            task_index: taskIndex,
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}

                  {/* Add new task */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Input
                      placeholder="Add a new task..."
                      value={newTaskInputs[category.category_name] || ""}
                      onChange={(e) => setNewTaskInputs(prev => ({
                        ...prev,
                        [category.category_name]: e.target.value
                      }))}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTask(categoryIndex, category.category_name)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleAddTask(categoryIndex, category.category_name)}
                      disabled={!newTaskInputs[category.category_name]?.trim()}
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <Card className="border-0 shadow-sm bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 District Lead tasks are reviewed monthly and focus on strategic oversight and regional coordination.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}