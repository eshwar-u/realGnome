import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X, ScanLine, Leaf, ShieldAlert, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const pendingResults = [
  {
    icon: Leaf,
    iconBg: "bg-leaf/20",
    iconColor: "text-leaf",
    title: "Plant Identification",
    description: "Identify species, common name, and growing characteristics.",
  },
  {
    icon: ShieldAlert,
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
    title: "Disease Detection",
    description: "Scan for signs of fungal, bacterial, or pest-related disease.",
  },
  {
    icon: Stethoscope,
    iconBg: "bg-sky/20",
    iconColor: "text-sky",
    title: "Health Assessment",
    description: "Evaluate overall plant health and get care recommendations.",
  },
];

export default function VisualAnalyser() {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            Visual Analyser
          </h1>
          <p className="text-muted-foreground mt-1">
            Capture or upload a photo of your plant to analyse its health
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Capture panel */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-leaf" />
                  Plant Image
                </CardTitle>
                <CardDescription>
                  Take a photo or upload one from your device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image preview / drop zone */}
                {image ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-muted aspect-square">
                    <img
                      src={image}
                      alt="Captured plant"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-leaf/50 hover:bg-leaf/5 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-medium">Drop an image here</p>
                      <p className="text-xs mt-0.5">or click to browse</p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Camera capture — uses device camera on mobile */}
                  <Button
                    variant="nature"
                    className="flex-1 gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </div>

                {/* Hidden inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Analysis results panel */}
          <motion.div variants={itemVariants} className="space-y-4">
            {pendingResults.map((result) => {
              const Icon = result.icon;
              return (
                <Card key={result.title} className="opacity-60">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${result.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${result.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{result.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{result.description}</p>
                        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-0 bg-leaf/40 rounded-full" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {image ? "Analysis coming soon" : "Awaiting image"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
