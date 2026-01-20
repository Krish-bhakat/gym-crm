import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define a route for "clientImage"
  clientImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", file.ufsUrl);
      return { uploadedBy: "admin" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;