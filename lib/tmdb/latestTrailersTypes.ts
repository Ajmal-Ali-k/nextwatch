export type HomeTrailerCard = {
  id: string;
  title: string;
  date: string;
  image: string;
  youtubeKey: string;
  detailHref?: string;
};

export type HomeLatestTrailersByCategory = {
  Theatre: HomeTrailerCard[];
  "OTT Series": HomeTrailerCard[];
  "OTT Movies": HomeTrailerCard[];
  Upcoming: HomeTrailerCard[];
};
