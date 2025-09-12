import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  X,
  File,
  Image,
  Video,
  Music,
  FileText,
  Upload,
  Check,
} from "lucide-react";

interface FilePreview {
  id: string;
  file: File;
  url: string;
  type: "image" | "video" | "audio" | "document";
  progress: number;
  status: "uploading" | "completed" | "error";
}

interface FileUploadProps {
  onFilesSelected: (files: FilePreview[]) => void;
  onClose: () => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export const FileUpload = ({
  onFilesSelected,
  onClose,
  maxFiles = 10,
  acceptedTypes = [
    "image/*",
    "video/*",
    "audio/*",
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
  ],
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileType = (
    file: File
  ): "image" | "video" | "audio" | "document" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "document":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: FilePreview[] = Array.from(fileList)
        .slice(0, maxFiles)
        .map((file, index) => ({
          id: `${Date.now()}-${index}`,
          file,
          url: URL.createObjectURL(file),
          type: getFileType(file),
          progress: 0,
          status: "uploading" as const,
        }));

      setFiles(newFiles);

      // Simulate upload progress
      newFiles.forEach((filePreview, index) => {
        let progress = 0;
        const interval = setInterval(
          () => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === filePreview.id
                    ? { ...f, progress: 100, status: "completed" }
                    : f
                )
              );
            } else {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === filePreview.id ? { ...f, progress } : f
                )
              );
            }
          },
          200 + index * 100
        );
      });
    },
    [maxFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles);
      }
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSend = () => {
    const completedFiles = files.filter((f) => f.status === "completed");
    if (completedFiles.length > 0) {
      onFilesSelected(completedFiles);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Share Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {files.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
              isDragOver
                ? "border-primary bg-primary/5 scale-105"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
                  isDragOver ? "bg-primary/20 scale-110" : "bg-primary/10"
                )}
              >
                <Upload
                  className={cn(
                    "w-8 h-8 transition-colors duration-200",
                    isDragOver ? "text-primary" : "text-primary/60"
                  )}
                />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragOver
                    ? "Drop files here"
                    : "Drag files here or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Images, videos, documents up to 25MB each
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                Choose Files
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="max-h-96 overflow-y-auto space-y-3 mb-6">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-accent rounded-lg animate-fade-in"
                >
                  {file.type === "image" ? (
                    <img
                      src={file.url}
                      alt={file.file.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {getFileIcon(file.type)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file.size)}
                    </p>
                    {file.status === "uploading" && (
                      <Progress value={file.progress} className="mt-2 h-2" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === "completed" && (
                      <div className="w-6 h-6 bg-online rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="border-primary/20 text-primary hover:bg-primary/5"
              >
                Add More
              </Button>
              <Button
                onClick={handleSend}
                disabled={!files.some((f) => f.status === "completed")}
                className="flex-1 bg-primary hover:bg-primary-dark text-white"
              >
                Send {files.filter((f) => f.status === "completed").length}{" "}
                Files
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};
