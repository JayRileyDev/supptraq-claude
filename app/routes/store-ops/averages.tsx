import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Save,
  Target,
  Activity,
  BarChart3
} from "lucide-react";
import { cn } from "~/lib/utils";

// Default reps list - in a real app, this would come from a master list
const DEFAULT_REPS = [
  "Ethan", "Nate", "Harman", "Jayson", "Shaylyn", "Berlin", 
  "Kaleb", "Ryan", "Siegfred", "Tyrell", "Tyson", "Brent", 
  "Jayshon", "Zac", "Michalla"
];

export default function Averages() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthlyAverages = useQuery(api.repAverages.getMonthlyAverages, { month: currentMonth });
  const existingReps = useQuery(api.repAverages.getAllReps);
  const updateRepAverage = useMutation(api.repAverages.upsertRepAverage);
  
  const [repData, setRepData] = useState<Record<string, any>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Get all unique reps for rendering (memoized to prevent recreating on every render)
  const allReps = useMemo(() => {
    return [...new Set([...(existingReps || []), ...DEFAULT_REPS])].sort();
  }, [existingReps]);

  // Initialize rep data when monthly averages load
  useEffect(() => {
    if (monthlyAverages && allReps.length > 0) {
      const data: Record<string, any> = {};
      
      // Initialize all reps with empty data
      allReps.forEach(repName => {
        data[repName] = {
          daily_averages: Array.from({ length: 31 }, (_, i) => ({
            date: i + 1,
            amount: undefined,
            shifts: undefined
          })),
          monthly_average: 0,
          monthly_shifts: 0,
          commission_level: undefined
        };
      });

      // Fill in existing data
      monthlyAverages.forEach(avg => {
        data[avg.rep_name] = {
          daily_averages: avg.daily_averages,
          monthly_average: avg.monthly_average,
          monthly_shifts: avg.monthly_shifts,
          commission_level: avg.commission_level
        };
      });

      setRepData(data);
      setHasChanges(false);
    }
  }, [monthlyAverages, allReps]);

  const handleDayChange = (repName: string, day: number, field: 'amount' | 'shifts', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    
    setRepData(prev => ({
      ...prev,
      [repName]: {
        ...prev[repName],
        daily_averages: prev[repName].daily_averages.map((d: any) =>
          d.date === day ? { ...d, [field]: numValue } : d
        )
      }
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      // Save each rep's data
      await Promise.all(
        Object.entries(repData).map(([repName, data]) =>
          updateRepAverage({
            month: currentMonth,
            rep_name: repName,
            daily_averages: data.daily_averages,
            commission_level: data.commission_level
          })
        )
      );
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save averages:", error);
    }
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const formatMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getAverageColor = (amount?: number) => {
    if (!amount) return "";
    if (amount < 150) return "text-red-600 bg-red-50";
    if (amount < 200) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const daysInMonth = getDaysInMonth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sales Rep Averages</h1>
              <p className="text-muted-foreground">
                Track daily sales averages and commission levels
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(-1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium text-sm px-3">
              {formatMonth()}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth(1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {hasChanges && (
            <Button onClick={saveChanges} className="shadow-lg">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Team Average</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    ${Math.round(
                      Object.values(repData).reduce((sum, rep) => sum + (rep.monthly_average || 0), 0) / 
                      Object.keys(repData).length || 0
                    )}
                  </p>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Per shift
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Monthly performance</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Active Reps</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {Object.values(repData).filter(rep => rep.monthly_shifts > 0).length}
                  </p>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Working
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-800">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Shifts</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {Object.values(repData).reduce((sum, rep) => sum + (rep.monthly_shifts || 0), 0)}
                  </p>
                  <Badge variant="secondary" className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                    Combined
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Team total</p>
              </div>
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-200 dark:border-violet-800">
                <Calendar className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Averages Calendar Grid */}
      <div>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Daily Averages Calendar</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatMonth()}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-background p-3 text-left font-semibold text-foreground">Rep</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i} className="min-w-[60px] p-2 text-center text-sm font-medium text-muted-foreground">
                        {i + 1}
                      </th>
                    ))}
                    <th className="p-3 text-center font-semibold text-foreground">Monthly Avg</th>
                    <th className="p-3 text-center font-semibold text-foreground">Shifts</th>
                    <th className="p-3 text-center font-semibold text-foreground">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {allReps.map((repName, repIndex) => {
                    const rep = repData[repName];
                    if (!rep) return null;

                    return (
                      <tr 
                        key={repName} 
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="sticky left-0 bg-background p-3 font-medium text-foreground border-r border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {repName[0]}
                            </div>
                            {repName}
                          </div>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const dayData = rep.daily_averages.find((d: any) => d.date === i + 1);
                          return (
                            <td key={i} className="p-1">
                              <Input
                                type="number"
                                className={cn(
                                  "h-9 w-full text-center text-sm border-0 bg-muted/30 hover:bg-muted/50 focus:bg-background transition-colors",
                                  getAverageColor(dayData?.amount)
                                )}
                                value={dayData?.amount || ''}
                                onChange={(e) => handleDayChange(repName, i + 1, 'amount', e.target.value)}
                                placeholder="-"
                              />
                            </td>
                          );
                        })}
                        <td className="p-3 text-center border-l border-border">
                          <Badge 
                            variant="secondary" 
                            className={cn("font-medium", getAverageColor(rep.monthly_average))}
                          >
                            ${Math.round(rep.monthly_average || 0)}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-muted-foreground font-medium">
                          {rep.monthly_shifts || 0}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            className="rounded-lg border border-border bg-background p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={rep.commission_level || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setRepData(prev => ({
                                ...prev,
                                [repName]: {
                                  ...prev[repName],
                                  commission_level: value as any
                                }
                              }));
                              setHasChanges(true);
                            }}
                          >
                            <option value="">Select Level</option>
                            <option value="125">$125 Level</option>
                            <option value="199">$199 Level</option>
                            <option value="299">$299 Level</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Performance Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/30" />
                <span className="text-muted-foreground">Below $150</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded bg-yellow-100 border border-yellow-200 dark:bg-yellow-900/30" />
                <span className="text-muted-foreground">$150-$199</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded bg-green-100 border border-green-200 dark:bg-green-900/30" />
                <span className="text-muted-foreground">$200+</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}