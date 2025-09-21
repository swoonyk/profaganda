```bash
pnpm pipeline:ingest-professors   # fetch professors from RMP & CUReviews
pnpm pipeline:ingest-reviews      # fetch reviews for existing professors 
pnpm pipeline:stats               # check db statistics



pnpm pipeline:ingest              # professors + reviews + AI sanitization
pnpm pipeline:generate            # generate AI reviews for professors
```

```bash
pnpm pipeline:test-rmp            # test RMP db client 
pnpm pipeline:test                # test entire pipeline
pnpm pipeline:test-full           # validation of all components
pnpm pipeline:stats               # View db statistics
```
