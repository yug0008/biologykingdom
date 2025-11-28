import { QueryClient, dehydrate } from '@tanstack/react-query'

export const createQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  })

export const queryClient = createQueryClient()

// Helper function for SSR dehydration
export const dehydrateQueries = (queryClient) => {
  return dehydrate(queryClient)
}