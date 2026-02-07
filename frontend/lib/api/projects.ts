import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./client";

export interface Project {
  _id: string;
  name: string;
  description?: string;
}

export function useGetProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      // This calls GET http://localhost:3001/api/v1/projects
      return await apiClient.get<Project[]>("/projects");
    },
  });
}
