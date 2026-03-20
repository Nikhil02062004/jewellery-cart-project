import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
interface FeedbackStats {
  total_feedback: number;
  avg_rating: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
  feedback_with_comments: number;
}
interface AgentStats {
  agent_id: string;
  display_name: string;
  total_conversations: number;
  avg_response_time_seconds: number;
  avg_resolution_time_seconds: number;
  avg_satisfaction_rating: number;
  total_messages_sent: number;
}
interface ChatAnalyticsExportProps {
  feedbackStats?: FeedbackStats | null;
  agentStats?: AgentStats[];
  type: 'feedback' | 'agents' | 'all';
}
export const ChatAnalyticsExport = ({ feedbackStats, agentStats, type }: ChatAnalyticsExportProps) => {
  const [exporting, setExporting] = useState(false);
  const formatTime = (seconds: number) => {
    if (seconds === 0) return "N/A";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };
  const exportFeedbackCSV = () => {
    if (!feedbackStats) return;
    const csvContent = [
      'Feedback Analytics Report',
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      '',
      'Metric,Value',
      `Total Feedback,${feedbackStats.total_feedback}`,
      `Average Rating,${Number(feedbackStats.avg_rating).toFixed(2)}`,
      `1 Star Reviews,${feedbackStats.rating_1_count}`,
      `2 Star Reviews,${feedbackStats.rating_2_count}`,
      `3 Star Reviews,${feedbackStats.rating_3_count}`,
      `4 Star Reviews,${feedbackStats.rating_4_count}`,
      `5 Star Reviews,${feedbackStats.rating_5_count}`,
      `Feedback With Comments,${feedbackStats.feedback_with_comments}`,
    ].join('\n');
    downloadFile(csvContent, 'feedback-analytics.csv', 'text/csv');
    toast.success('Feedback analytics exported as CSV');
  };
  const exportAgentCSV = () => {
    if (!agentStats || agentStats.length === 0) return;
    const headers = ['Agent', 'Conversations', 'Avg Response Time', 'Avg Resolution Time', 'Messages Sent', 'Satisfaction Rating'];
    const rows = agentStats.map(agent => [
      `"${agent.display_name}"`,
      agent.total_conversations,
      formatTime(agent.avg_response_time_seconds),
      formatTime(agent.avg_resolution_time_seconds),
      agent.total_messages_sent,
      agent.avg_satisfaction_rating > 0 ? agent.avg_satisfaction_rating.toFixed(2) : 'N/A',
    ]);
    const csvContent = [
      'Agent Performance Report',
      `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    downloadFile(csvContent, 'agent-performance.csv', 'text/csv');
    toast.success('Agent performance exported as CSV');
  };
  const exportFeedbackPDF = () => {
    if (!feedbackStats) return;
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(20);
      doc.text('Feedback Analytics Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });
      doc.setFontSize(14);
      doc.text('Overview', 14, 45);
      doc.setFontSize(11);
      let yPos = 55;
      const stats = [
        ['Total Feedback', feedbackStats.total_feedback.toString()],
        ['Average Rating', `${Number(feedbackStats.avg_rating).toFixed(2)} / 5`],
        ['5 Star Reviews', feedbackStats.rating_5_count.toString()],
        ['4 Star Reviews', feedbackStats.rating_4_count.toString()],
        ['3 Star Reviews', feedbackStats.rating_3_count.toString()],
        ['2 Star Reviews', feedbackStats.rating_2_count.toString()],
        ['1 Star Reviews', feedbackStats.rating_1_count.toString()],
        ['With Comments', feedbackStats.feedback_with_comments.toString()],
      ];
      stats.forEach(([label, value]) => {
        doc.text(`${label}: ${value}`, 14, yPos);
        yPos += 8;
      });
      doc.save('feedback-analytics.pdf');
      toast.success('Feedback analytics exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };
  const exportAgentPDF = () => {
    if (!agentStats || agentStats.length === 0) return;
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(20);
      doc.text('Agent Performance Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}`, pageWidth / 2, 28, { align: 'center' });
      // Table header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let yPos = 50;
      const headers = ['Agent', 'Convos', 'Resp Time', 'Res Time', 'Msgs', 'Rating'];
      const colWidths = [45, 25, 30, 30, 25, 25];
      headers.forEach((header, i) => {
        const xPos = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, xPos, yPos);
      });
      doc.setFont('helvetica', 'normal');
      yPos += 8;
      agentStats.forEach((agent) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const row = [
          agent.display_name.substring(0, 20),
          agent.total_conversations.toString(),
          formatTime(agent.avg_response_time_seconds),
          formatTime(agent.avg_resolution_time_seconds),
          agent.total_messages_sent.toString(),
          agent.avg_satisfaction_rating > 0 ? agent.avg_satisfaction_rating.toFixed(1) : 'N/A',
        ];
        row.forEach((cell, i) => {
          const xPos = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, xPos, yPos);
        });
        yPos += 7;
      });
      doc.save('agent-performance.pdf');
      toast.success('Agent performance exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };
  const hasData = (type === 'feedback' && feedbackStats) || 
                  (type === 'agents' && agentStats && agentStats.length > 0) ||
                  (type === 'all' && (feedbackStats || (agentStats && agentStats.length > 0)));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting || !hasData}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border">
        {(type === 'feedback' || type === 'all') && feedbackStats && (
          <>
            <DropdownMenuItem onClick={exportFeedbackCSV} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Feedback Report (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportFeedbackPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Feedback Report (PDF)
            </DropdownMenuItem>
          </>
        )}
        {(type === 'agents' || type === 'all') && agentStats && agentStats.length > 0 && (
          <>
            <DropdownMenuItem onClick={exportAgentCSV} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Agent Performance (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportAgentPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Agent Performance (PDF)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};