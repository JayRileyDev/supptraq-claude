/**
 * Utility functions for average ticket color coding
 * Rules: <$70 = red, $70-$79 = blue, $80+ = green
 */

export function getAvgTicketColor(avgTicket: number): string {
  if (avgTicket < 70) {
    return 'text-red-600 dark:text-red-400';
  } else if (avgTicket >= 70 && avgTicket < 80) {
    return 'text-blue-600 dark:text-blue-400';
  } else {
    return 'text-green-600 dark:text-green-400';
  }
}

export function getAvgTicketBgColor(avgTicket: number): string {
  if (avgTicket < 70) {
    return 'bg-red-100 dark:bg-red-900/20';
  } else if (avgTicket >= 70 && avgTicket < 80) {
    return 'bg-blue-100 dark:bg-blue-900/20';
  } else {
    return 'bg-green-100 dark:bg-green-900/20';
  }
}

export function getAvgTicketBorderColor(avgTicket: number): string {
  if (avgTicket < 70) {
    return 'border-red-200 dark:border-red-800';
  } else if (avgTicket >= 70 && avgTicket < 80) {
    return 'border-blue-200 dark:border-blue-800';
  } else {
    return 'border-green-200 dark:border-green-800';
  }
}

export function getAvgTicketBadgeVariant(avgTicket: number): 'destructive' | 'secondary' | 'default' {
  if (avgTicket < 70) {
    return 'destructive';
  } else if (avgTicket >= 70 && avgTicket < 80) {
    return 'secondary';
  } else {
    return 'default';
  }
}

export function getAvgTicketStatus(avgTicket: number): { status: string; color: string } {
  if (avgTicket < 70) {
    return { status: 'Below Target', color: 'text-red-600 dark:text-red-400' };
  } else if (avgTicket >= 70 && avgTicket < 80) {
    return { status: 'At Target', color: 'text-blue-600 dark:text-blue-400' };
  } else {
    return { status: 'Above Target', color: 'text-green-600 dark:text-green-400' };
  }
}