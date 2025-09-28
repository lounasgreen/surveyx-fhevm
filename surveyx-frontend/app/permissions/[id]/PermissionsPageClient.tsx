"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useToast } from "../../providers";
import { AlertCircle, Users, Settings, Clock } from "lucide-react";

export default function PermissionsPageClient() {
  const params = useParams();
  const surveyId = params.id as string;
  const { addToast } = useToast();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-10 bg-card rounded-lg shadow-md">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-muted-foreground mb-4">Permissions Management</h1>
        <p className="text-muted-foreground">
          Survey permissions management for survey ID: {surveyId}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This feature is under development.
        </p>
      </div>
    </div>
  );
}
