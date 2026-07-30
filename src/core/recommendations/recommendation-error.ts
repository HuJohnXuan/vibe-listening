export interface RecommendationErrorOptions {
  readonly code: "TRACK_NOT_FOUND";
  readonly message: string;
  readonly context: {
    readonly currentTrackId: string;
  };
}

export class RecommendationError extends Error {
  readonly code: RecommendationErrorOptions["code"];
  readonly context: RecommendationErrorOptions["context"];

  constructor(options: RecommendationErrorOptions) {
    super(options.message);
    this.name = "RecommendationError";
    this.code = options.code;
    this.context = options.context;
  }
}
