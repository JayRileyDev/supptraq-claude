import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Save
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

  // Get all unique reps (combine existing with defaults)
  const allReps = [...new Set([...(existingReps || []), ...DEFAULT_REPS])].sort();

  // Initialize rep data when monthly averages load
  useEffect(() => {
    if (monthlyAverages) {
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
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Rep Averages</h1>
          <p className="mt-2 text-gray-600">
            Track daily sales averages and commission levels
          </p>
        </div>
        <div className="flex items-center gap-4">
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
          {hasChanges && (
            <Button onClick={saveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(
                Object.values(repData).reduce((sum, rep) => sum + (rep.monthly_average || 0), 0) / 
                Object.keys(repData).length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per shift average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Reps</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(repData).filter(rep => rep.monthly_shifts > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(repData).reduce((sum, rep) => sum + (rep.monthly_shifts || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Combined team shifts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Averages Grid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white p-2 text-left font-medium">Rep</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i} className="min-w-[60px] p-1 text-center text-sm">
                      {i + 1}
                    </th>
                  ))}
                  <th className="p-2 text-center font-medium">Avg</th>
                  <th className="p-2 text-center font-medium">Shifts</th>
                  <th className="p-2 text-center font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {allReps.map(repName => {
                  const rep = repData[repName];
                  if (!rep) return null;

                  return (
                    <tr key={repName} className="border-t">
                      <td className="sticky left-0 bg-white p-2 font-medium">
                        {repName}
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const dayData = rep.daily_averages.find((d: any) => d.date === i + 1);
                        return (
                          <td key={i} className="p-1">
                            <Input
                              type="number"
                              className={cn(
                                "h-8 w-full text-center text-sm",
                                getAverageColor(dayData?.amount)
                              )}
                              value={dayData?.amount || ''}
                              onChange={(e) => handleDayChange(repName, i + 1, 'amount', e.target.value)}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                      <td className={cn("p-2 text-center font-medium", getAverageColor(rep.monthly_average))}>
                        ${Math.round(rep.monthly_average || 0)}
                      </td>
                      <td className="p-2 text-center">
                        {rep.monthly_shifts || 0}
                      </td>
                      <td className="p-2 text-center">
                        <select
                          className="rounded border p-1 text-sm"
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
                          <option value="">-</option>
                          <option value="125">$125</option>
                          <option value="199">$199</option>
                          <option value="299">$299</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-50 border border-red-200" />
              <span>Below $150</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-yellow-50 border border-yellow-200" />
              <span>$150-$199</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-50 border border-green-200" />
              <span>$200+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}