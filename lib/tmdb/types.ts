export type TmdbDiscoverMovieResult = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
};

export type TmdbDiscoverResponse = {
  page: number;
  results: TmdbDiscoverMovieResult[];
  total_pages: number;
  total_results: number;
};

export type NormalizedDiscoverMovie = {
  id: number;
  title: string;
  releaseDate: string;
  posterUrl: string | null;
  overview: string;
};

export type TmdbDiscoverTvResult = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
};

export type TmdbDiscoverTvResponse = {
  page: number;
  results: TmdbDiscoverTvResult[];
  total_pages: number;
  total_results: number;
};

export type NormalizedDiscoverTvShow = {
  id: number;
  title: string;
  firstAirDate: string;
  posterUrl: string | null;
  overview: string;
};
