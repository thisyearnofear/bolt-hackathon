import React, { useState, useEffect } from "react";
import {
  ContestantData,
  ContestantCategory,
  TRACKS,
} from "../lib/ContestantData";
import { StorachaNetlifyClient } from "../lib/storacha/StorachaNetlifyClient";
import "./ContentManager.css";

interface ContentManagerProps {
  category: ContestantCategory;
  onSave: () => void;
  onCancel: () => void;
}

interface ContentItem {
  id: string;
  name: string;
  description: string;
  details: Record<string, any>; // Flexible schema for different content types
}

const getDefaultContentForCategory = (
  category: ContestantCategory
): Partial<ContentItem> => {
  switch (category) {
    case "prize":
      return {
        name: "New Prize",
        description: "Description of the prize",
        details: {
          amount: "$1,000",
          track: "General",
          criteria: "Criteria for winning this prize",
          deadline: new Date().toISOString().split("T")[0],
        },
      };
    case "sponsor":
      return {
        name: "New Sponsor",
        description: "Description of the sponsor",
        details: {
          tier: "Gold",
          website: "https://example.com",
          resources: "Resources provided by the sponsor",
          contact: "contact@example.com",
        },
      };
    case "judge":
      return {
        name: "New Judge",
        description: "Description of the judge",
        details: {
          expertise: "Area of expertise",
          company: "Company name",
          bio: "Judge's biography",
          linkedin: "https://linkedin.com/in/username",
        },
      };
    case "contestant":
      return {
        name: "New Team",
        description: "Description of the team",
        details: {
          members: 1,
          project: "Project name",
          track: "General",
          status: "Registered",
        },
      };
    default:
      return {
        name: "New Item",
        description: "Description",
        details: {},
      };
  }
};

export function ContentManager({
  category,
  onSave,
  onCancel,
}: ContentManagerProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ContentItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [storachaClient] = useState(() => new StorachaNetlifyClient());

  const contentTypeLabel =
    category.charAt(0).toUpperCase() + category.slice(1) + "s";

  useEffect(() => {
    loadContent();
  }, [category]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Loading content for ${category}`);
      await storachaClient.initialize();

      // First try to get real content
      try {
        // The content ID is in the format "content-{category}"
        const contentId = `content-${category}`;
        console.log(`Fetching content with ID: ${contentId}`);

        // First, try to resolve the content ID to a CID
        const mapping = await storachaClient.getContentMapping();
        const cid = mapping[contentId];

        if (!cid) {
          console.warn(
            `No CID mapping found for ${contentId}, content may not exist yet`
          );
          throw new Error(`No mapping for ${contentId}`);
        }

        console.log(`Resolved ${contentId} to CID: ${cid}`);

        // Now fetch using the actual CID instead of the content ID
        let contentData;
        try {
          // Try to download via StorachaNetlifyClient with the resolved CID
          contentData = await storachaClient.downloadAgentData(cid);
          console.log("Downloaded data:", contentData);
          console.log("Downloaded data type:", typeof contentData);

          if (typeof contentData === "string") {
            console.log(
              "Downloaded string content (first 100 chars):",
              contentData.substring(0, 100)
            );
          } else if (typeof contentData === "object") {
            console.log("Downloaded object keys:", Object.keys(contentData));
          }
        } catch (downloadError) {
          console.error(`Error downloading content: ${downloadError.message}`);

          // Clear the content mappings cache to force a reload
          // This helps if we've recently saved a new version
          console.log("Clearing content mappings cache to force reload");
          StorachaNetlifyClient.clearContentMappingsCache();

          // Wait a moment and try again
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Get fresh mapping
          const freshMapping = await storachaClient.getContentMapping();
          const freshCid = freshMapping[contentId];

          if (freshCid) {
            console.log(`Retrying with fresh CID: ${freshCid}`);
            contentData = await storachaClient.downloadAgentData(freshCid);
          } else {
            throw new Error(`Content ${contentId} not found after refresh`);
          }
        }

        let parsedContent;

        // Content comes back as base64-encoded JSON
        if (contentData && typeof contentData === "string") {
          try {
            // Try to parse it directly as JSON first
            parsedContent = JSON.parse(contentData);
            console.log("Successfully parsed content as JSON:", parsedContent);
          } catch (parseError) {
            // Try to decode it as base64 if direct parsing fails
            try {
              const decoded = atob(contentData);
              parsedContent = JSON.parse(decoded);
              console.log(
                "Successfully parsed base64-decoded content:",
                parsedContent
              );
            } catch (decodeError) {
              console.error("Error decoding content:", decodeError);
              throw new Error("Invalid content format");
            }
          }
        } else if (contentData && typeof contentData === "object") {
          // It's already an object
          console.log("Content is already an object:", contentData);
          parsedContent = contentData;
        } else {
          throw new Error("Invalid content format");
        }

        // Now process the parsed content to ensure it has the expected structure
        let processedItems = [];
        console.log("Parsed content structure:", parsedContent);
        console.log("Parsed content keys:", Object.keys(parsedContent));

        // Check for items array in the content
        if (parsedContent.items && Array.isArray(parsedContent.items)) {
          console.log(
            "Found items array in content:",
            parsedContent.items.length
          );
          processedItems = parsedContent.items.map((item) => {
            // Ensure each item has an id and the expected format
            return {
              id:
                item.id ||
                `${category}-${Date.now()}-${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              name: item.name || "Unnamed Item",
              description: item.description || "",
              details: item.details || {},
            };
          });
        } else {
          // Try to use the content directly if it's an array
          if (Array.isArray(parsedContent)) {
            console.log("Parsed content is an array:", parsedContent.length);
            processedItems = parsedContent.map((item) => {
              return {
                id:
                  item.id ||
                  `${category}-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                name: item.name || "Unnamed Item",
                description: item.description || "",
                details: item.details || {},
              };
            });
          } else if (
            parsedContent.content &&
            Array.isArray(parsedContent.content)
          ) {
            console.log(
              "Found content array in parsed content:",
              parsedContent.content.length
            );
            // Some responses might nest content under a "content" property
            processedItems = parsedContent.content.map((item: any) => ({
              id: item.id || `${category}-${Date.now()}`,
              name: item.name || "Unnamed Item",
              description: item.description || "",
              details: item.details || {},
            }));
          } else {
            // Create a single item from the content if it's not an array or doesn't have items
            console.log("Creating single item from content");
            processedItems = [
              {
                id: `${category}-${Date.now()}`,
                name: parsedContent.name || `${category} Content`,
                description: parsedContent.description || "",
                details: parsedContent.details || {},
              },
            ];
          }
        }

        console.log("Processed items:", processedItems);
        setItems(processedItems);
      } catch (contentError) {
        console.error("Error loading content:", contentError);
        setError(
          `Failed to load ${category} content from storage. Using sample data. ${contentError.message}`
        );

        // Fall back to empty content if real content can't be loaded
        const sampleData = generateSampleData(category);
        setItems(sampleData);
      }
    } catch (error) {
      console.error("Error loading content:", error);
      setError(`Failed to load content: ${error.message}`);
      const sampleData = generateSampleData(category);
      setItems(sampleData);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    setSaving(true);
    setError(null);

    try {
      await storachaClient.initialize();

      const contentKey = `content-${category}`;
      const contentData = {
        name: `${category}-content`,
        description: `${contentTypeLabel} content for the hackathon`,
        items: items,
        timestamp: new Date().toISOString(),
        category: category,
      };

      console.log(`Saving ${contentTypeLabel} content:`, contentData);
      console.log(`Content items count: ${items.length}`);
      console.log(`First item:`, items[0]);

      // Clear existing content mapping before saving new content
      StorachaNetlifyClient.clearContentMappingsCache();

      // Save the content with appropriate structure
      const cid = await storachaClient.uploadAgentData(
        "system",
        category,
        contentKey,
        JSON.stringify(contentData),
        [`${contentTypeLabel} content updated`]
      );

      console.log(`Content saved successfully with CID: ${cid}`);

      // Wait a moment to ensure content mapping is updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force reload the content mappings to pick up the new mapping
      StorachaNetlifyClient.clearContentMappingsCache();

      // Try to re-load content to verify everything worked
      try {
        await loadContent();
        console.log("Content reloaded successfully after save");
      } catch (reloadError) {
        console.warn("Note: Could not reload content after save:", reloadError);
      }

      onSave();
    } catch (err) {
      console.error("Error saving content:", err);
      setError("Failed to save content. Retrying...");

      // Wait a moment and try again
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        StorachaNetlifyClient.clearContentMappingsCache();

        const contentKey = `content-${category}`;
        const contentData = {
          name: `${category}-content`,
          description: `${contentTypeLabel} content for the hackathon`,
          items: items,
          timestamp: new Date().toISOString(),
          category: category,
        };

        await storachaClient.uploadAgentData(
          "system",
          category,
          contentKey,
          JSON.stringify(contentData),
          [`${contentTypeLabel} content updated - retry`]
        );

        console.log("Content saved successfully on retry");
        onSave();
      } catch (retryErr) {
        console.error("Error on retry:", retryErr);
        setError("Failed to save content after retry. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const addNewItem = () => {
    const newItemTemplate = getDefaultContentForCategory(category);
    const newItem: ContentItem = {
      id: `${category}-${Date.now()}`,
      name: newItemTemplate.name || "",
      description: newItemTemplate.description || "",
      details: newItemTemplate.details || {},
    };

    setCurrentItem(newItem);
    setEditingItemId(null);
  };

  const editItem = (item: ContentItem) => {
    setCurrentItem({ ...item });
    setEditingItemId(item.id);
  };

  const deleteItem = (id: string) => {
    if (window.confirm(`Are you sure you want to delete this ${category}?`)) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const saveItem = () => {
    if (!currentItem) return;

    if (editingItemId) {
      setItems(
        items.map((item) => (item.id === editingItemId ? currentItem : item))
      );
    } else {
      setItems([...items, currentItem]);
    }

    setCurrentItem(null);
    setEditingItemId(null);
  };

  const cancelEdit = () => {
    setCurrentItem(null);
    setEditingItemId(null);
  };

  const updateItemField = (field: string, value: any) => {
    if (!currentItem) return;

    if (field.includes(".")) {
      // Handle nested fields in details
      const [parent, child] = field.split(".");
      if (parent === "details") {
        setCurrentItem({
          ...currentItem,
          details: {
            ...currentItem.details,
            [child]: value,
          },
        });
      }
    } else {
      // Handle top-level fields
      setCurrentItem({
        ...currentItem,
        [field]: value,
      });
    }
  };

  const generateSampleData = (category: ContestantCategory): ContentItem[] => {
    switch (category) {
      case "prize":
        return [
          {
            id: "prize-1",
            name: "Grand Prize",
            description:
              "Best overall project with the most innovative solution",
            details: {
              amount: "$5,000",
              track: "AI/ML",
              criteria:
                "Innovation, technical difficulty, and potential impact",
              deadline: "2023-09-30",
            },
          },
          {
            id: "prize-2",
            name: "Runner-Up",
            description: "Second place project with technical excellence",
            details: {
              amount: "$3,000",
              track: "Web3",
              criteria: "Technical implementation and creativity",
              deadline: "2023-09-30",
            },
          },
          {
            id: "prize-3",
            name: "Community Choice",
            description: "Project with the most community votes and engagement",
            details: {
              amount: "$2,000",
              track: "Social Impact",
              criteria: "Community engagement and social benefit",
              deadline: "2023-09-30",
            },
          },
        ];
      case "sponsor":
        return [
          {
            id: "sponsor-1",
            name: "TechCorp",
            description:
              "Leading technology provider with cloud infrastructure",
            details: {
              tier: "Platinum",
              website: "https://techcorp.example.com",
              resources: "Cloud credits, mentorship, and API access",
              contact: "sponsors@techcorp.example.com",
            },
          },
          {
            id: "sponsor-2",
            name: "DevTools Inc",
            description: "Development tools and productivity solutions",
            details: {
              tier: "Gold",
              website: "https://devtools.example.com",
              resources: "Software licenses and technical workshops",
              contact: "partnerships@devtools.example.com",
            },
          },
        ];
      case "judge":
        return [
          {
            id: "judge-1",
            name: "Alex Johnson",
            description: "AI researcher and entrepreneur",
            details: {
              expertise: "Machine Learning, NLP",
              company: "AI Innovations",
              bio: "10+ years of experience in AI research and startups",
              linkedin: "https://linkedin.com/in/alexjohnson",
            },
          },
          {
            id: "judge-2",
            name: "Sam Chen",
            description: "Blockchain expert and investor",
            details: {
              expertise: "Web3, Blockchain",
              company: "Crypto Ventures",
              bio: "Early blockchain adopter and advisor to multiple projects",
              linkedin: "https://linkedin.com/in/samchen",
            },
          },
        ];
      case "contestant":
        return [
          {
            id: "contestant-1",
            name: "CodeCrafters",
            description:
              "Full-stack development team specializing in AI solutions",
            details: {
              members: 4,
              project: "AI-powered content generator",
              track: "AI/ML",
              status: "In Progress",
            },
          },
          {
            id: "contestant-2",
            name: "Blockchain Builders",
            description: "Web3 enthusiasts building decentralized applications",
            details: {
              members: 3,
              project: "Decentralized marketplace",
              track: "Web3",
              status: "In Progress",
            },
          },
        ];
      default:
        return [];
    }
  };

  const renderItemFields = () => {
    if (!currentItem) return null;

    return (
      <div className="item-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={currentItem.name}
            onChange={(e) => updateItemField("name", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={currentItem.description}
            onChange={(e) => updateItemField("description", e.target.value)}
          />
        </div>

        {category === "prize" && (
          <>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="text"
                value={currentItem.details.amount || ""}
                onChange={(e) =>
                  updateItemField("details.amount", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Track</label>
              <input
                type="text"
                value={currentItem.details.track || ""}
                onChange={(e) =>
                  updateItemField("details.track", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Criteria</label>
              <textarea
                value={currentItem.details.criteria || ""}
                onChange={(e) =>
                  updateItemField("details.criteria", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={currentItem.details.deadline || ""}
                onChange={(e) =>
                  updateItemField("details.deadline", e.target.value)
                }
              />
            </div>
          </>
        )}

        {category === "sponsor" && (
          <>
            <div className="form-group">
              <label>Tier</label>
              <select
                value={currentItem.details.tier || ""}
                onChange={(e) =>
                  updateItemField("details.tier", e.target.value)
                }
              >
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="text"
                value={currentItem.details.website || ""}
                onChange={(e) =>
                  updateItemField("details.website", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Resources</label>
              <textarea
                value={currentItem.details.resources || ""}
                onChange={(e) =>
                  updateItemField("details.resources", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Contact</label>
              <input
                type="text"
                value={currentItem.details.contact || ""}
                onChange={(e) =>
                  updateItemField("details.contact", e.target.value)
                }
              />
            </div>
          </>
        )}

        {category === "judge" && (
          <>
            <div className="form-group">
              <label>Expertise</label>
              <input
                type="text"
                value={currentItem.details.expertise || ""}
                onChange={(e) =>
                  updateItemField("details.expertise", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                value={currentItem.details.company || ""}
                onChange={(e) =>
                  updateItemField("details.company", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={currentItem.details.bio || ""}
                onChange={(e) => updateItemField("details.bio", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="text"
                value={currentItem.details.linkedin || ""}
                onChange={(e) =>
                  updateItemField("details.linkedin", e.target.value)
                }
              />
            </div>
          </>
        )}

        {category === "contestant" && (
          <>
            <div className="form-group">
              <label>Team Members</label>
              <input
                type="number"
                value={currentItem.details.members || 1}
                onChange={(e) =>
                  updateItemField(
                    "details.members",
                    parseInt(e.target.value) || 1
                  )
                }
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Project</label>
              <input
                type="text"
                value={currentItem.details.project || ""}
                onChange={(e) =>
                  updateItemField("details.project", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Track</label>
              <input
                type="text"
                value={currentItem.details.track || ""}
                onChange={(e) =>
                  updateItemField("details.track", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={currentItem.details.status || ""}
                onChange={(e) =>
                  updateItemField("details.status", e.target.value)
                }
              >
                <option value="Registered">Registered</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </>
        )}

        <div className="form-actions">
          <button className="action-button" onClick={saveItem}>
            {editingItemId ? "Update" : "Add"} {category}
          </button>
          <button className="secondary-button" onClick={cancelEdit}>
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderItemsList = () => {
    return (
      <div className="items-list">
        <div className="items-list-header">
          <h3>{contentTypeLabel} List</h3>
          <button className="action-button" onClick={addNewItem}>
            Add New {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-list">
            No {contentTypeLabel.toLowerCase()} found. Click the button above to
            add one.
          </div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <h4 className="item-name">{item.name}</h4>
                <p className="item-description">{item.description}</p>

                {category === "prize" && item.details && (
                  <div className="item-details">
                    <span className="detail-tag">
                      {item.details.amount || "N/A"}
                    </span>
                    <span className="detail-tag">
                      {item.details.track || "General"}
                    </span>
                  </div>
                )}

                {category === "sponsor" && item.details && (
                  <div className="item-details">
                    <span className="detail-tag">
                      {item.details.tier || "N/A"}
                    </span>
                  </div>
                )}

                {category === "judge" && item.details && (
                  <div className="item-details">
                    <span className="detail-tag">
                      {item.details.expertise || "N/A"}
                    </span>
                  </div>
                )}

                {category === "contestant" && item.details && (
                  <div className="item-details">
                    <span className="detail-tag">
                      {item.details.track || "General"}
                    </span>
                    <span className="detail-tag">
                      {item.details.status || "Registered"}
                    </span>
                  </div>
                )}

                <div className="item-actions">
                  <button onClick={() => editItem(item)}>Edit</button>
                  <button
                    className="delete-button"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="content-manager">
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          Loading {contentTypeLabel.toLowerCase()}...
        </div>
      ) : (
        <>
          {currentItem ? renderItemFields() : renderItemsList()}

          {!currentItem && (
            <div className="content-actions">
              <button
                className="action-button"
                onClick={saveContent}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save All Changes"}
              </button>
              <button className="secondary-button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
