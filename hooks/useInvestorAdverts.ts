export function useInvestorAdverts() {
  // mock 
  const mockData = [
    {
      id: "1",
      title: "AI Pants",
      elevator_pitch: "Transform your wardrobe with these AI-powered pants.",
      current_amount: 200000,
      target_amount: 250000,
      isPromoted: true,
      supporting_media: ["/file.svg"],
      imageUrl: "",
    },
    {
      id: "2",
      title: "AI Table",
      current_amount: 750000,
      target_amount: 1200000,
      isPromoted: true,
      supporting_media: ["/globe.svg"],
      imageUrl: "",
    },
    {
      id: "3",
      title: "AI Waterbottle",
      elevator_pitch: "Revolutionizing hydration with AI-powered water bottles.",
      current_amount: 80000,
      target_amount: 500000,
      isPromoted: true,
      supporting_media: ["/window.svg"],
      imageUrl: "",
    },
  ]

  return {
    data: mockData,
    isLoading: false,
    error: null,
  }
}
