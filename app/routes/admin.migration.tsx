import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AlertTriangle, CheckCircle, Play, RotateCcw } from "lucide-react";

export default function MigrationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const migrationStatus = useQuery(api.migrations.checkMigrationStatus);
  const runMigration = useMutation(api.migrations.migrateToMultiTenant);
  const rollbackMigration = useMutation(api.migrations.rollbackMigration);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await runMigration();
      setResult(migrationResult);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRollback = async () => {
    if (!confirm("Are you sure you want to rollback the migration? This will remove all org/franchise data.")) {
      return;
    }

    const confirmText = prompt('Type "ROLLBACK_MIGRATION" to confirm:');
    if (confirmText !== "ROLLBACK_MIGRATION") {
      alert("Rollback cancelled - incorrect confirmation text");
      return;
    }

    try {
      await rollbackMigration({ confirmText });
      setResult(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Multi-Tenant Migration
            </CardTitle>
            <CardDescription>
              Convert existing users to the new multi-tenant structure with organizations and franchises.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Migration Status */}
            {migrationStatus && (
              <div className="space-y-3">
                <h4 className="font-medium">Current Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <Badge variant={migrationStatus.organizationExists ? "default" : "secondary"} className="ml-2">
                      {migrationStatus.organizationExists ? "Created" : "Not Created"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Users:</span>
                    <Badge variant={migrationStatus.migrationComplete ? "default" : "secondary"} className="ml-2">
                      {migrationStatus.migratedUsers}/{migrationStatus.totalUsers} Migrated
                    </Badge>
                  </div>
                </div>
                <div>
                  <Badge variant={migrationStatus.migrationComplete ? "default" : "destructive"}>
                    {migrationStatus.migrationComplete ? "Migration Complete" : "Migration Needed"}
                  </Badge>
                </div>
              </div>
            )}

            {/* Migration Results */}
            {result && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Migration Successful!</span>
                </div>
                <div className="text-sm text-green-700">
                  <div>Migrated {result.migratedUsers} users</div>
                  <div>Organization ID: {result.organizationId}</div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Migration Failed</span>
                </div>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={handleRunMigration}
                disabled={isRunning || migrationStatus?.migrationComplete}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Migration...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Migration
                  </>
                )}
              </Button>

              {migrationStatus?.migrationComplete && (
                <Button 
                  variant="destructive"
                  onClick={handleRollback}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Rollback
                </Button>
              )}
            </div>

            {/* Warning */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <div className="font-medium mb-1">Important Notes:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>This migration will convert all existing users to franchise owners</li>
                    <li>All existing data will be preserved and properly scoped</li>
                    <li>Each user will get their own franchise under "Supplement King"</li>
                    <li>Make sure to backup your data before running</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}