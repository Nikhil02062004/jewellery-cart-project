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
import { format } from "date-fns";
import jsPDF from "jspdf";

interface Reel {
  id: string;
  caption: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
  views_count: number;
  likes_count: number;
}

interface AnalyticsExportProps {
  reels: Reel[];
  totalStats: {
    totalReels: number;
    totalViews: number;
    totalLikes: number;
    engagementRate: string;
  };
}

export function AnalyticsExport({ reels, totalStats }: AnalyticsExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["Caption", "Status", "Featured", "Created At", "Views", "Likes", "Engagement Rate"];
      const rows = reels.map((reel) => [
        `"${(reel.caption || "No caption").replace(/"/g, '""')}"`,
        reel.status,
        reel.is_featured ? "Yes" : "No",
        format(new Date(reel.created_at), "yyyy-MM-dd HH:mm"),
        reel.views_count,
        reel.likes_count,
        reel.views_count > 0 ? ((reel.likes_count / reel.views_count) * 100).toFixed(1) + "%" : "0%",
      ]);

      // Add summary row
      rows.push([]);
      rows.push(["SUMMARY"]);
      rows.push(["Total Reels", totalStats.totalReels]);
      rows.push(["Total Views", totalStats.totalViews]);
      rows.push(["Total Likes", totalStats.totalLikes]);
      rows.push(["Overall Engagement Rate", totalStats.engagementRate + "%"]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `reel-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      toast.success("Analytics exported as CSV");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.text("Reel Analytics Report", pageWidth / 2, 20, { align: "center" });

      // Date
      doc.setFontSize(10);
      doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy 'at' HH:mm")}`, pageWidth / 2, 28, { align: "center" });

      // Summary Stats
      doc.setFontSize(14);
      doc.text("Summary", 14, 45);
      doc.setFontSize(11);
      doc.text(`Total Reels: ${totalStats.totalReels}`, 14, 55);
      doc.text(`Total Views: ${totalStats.totalViews.toLocaleString()}`, 14, 62);
      doc.text(`Total Likes: ${totalStats.totalLikes.toLocaleString()}`, 14, 69);
      doc.text(`Engagement Rate: ${totalStats.engagementRate}%`, 14, 76);

      // Table header
      doc.setFontSize(14);
      doc.text("Reel Details", 14, 95);
      doc.setFontSize(9);
      
      let yPos = 105;
      const colWidths = [60, 20, 25, 25, 25, 30];
      const headers = ["Caption", "Status", "Views", "Likes", "Eng.%", "Created"];

      // Draw header
      doc.setFont("helvetica", "bold");
      headers.forEach((header, i) => {
        const xPos = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, xPos, yPos);
      });
      doc.setFont("helvetica", "normal");
      yPos += 7;

      // Draw rows
      reels.forEach((reel) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const engagement = reel.views_count > 0 
          ? ((reel.likes_count / reel.views_count) * 100).toFixed(1) + "%" 
          : "0%";
        
        const row = [
          (reel.caption || "No caption").substring(0, 25) + ((reel.caption?.length || 0) > 25 ? "..." : ""),
          reel.status,
          reel.views_count.toString(),
          reel.likes_count.toString(),
          engagement,
          format(new Date(reel.created_at), "MMM d, yy"),
        ];

        row.forEach((cell, i) => {
          const xPos = 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.text(cell, xPos, yPos);
        });
        yPos += 6;
      });

      doc.save(`reel-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Analytics exported as PDF");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export analytics");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || reels.length === 0} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
