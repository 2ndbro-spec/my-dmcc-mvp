import useSWR from "swr";

export function useGa4Report() {
  const { data, error, isLoading } = useSWR("/api/ga4/query", (u) =>
    fetch(u).then((r) => r.json())
  );
  return { data, error, isLoading };
}