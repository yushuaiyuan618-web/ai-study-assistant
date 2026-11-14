"""Small schemas for untrusted local-model output."""

from typing import Literal
import unicodedata

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator, model_validator


RelationType = Literal[
    "prerequisite_of", "part_of", "related_to", "contrasts_with", "applied_in"
]


def name_key(value):
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


class KnowledgeModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_validator("*", mode="after")
    @classmethod
    def reject_blank_strings(cls, value):
        if isinstance(value, str) and not value:
            raise ValueError("Knowledge text cannot be blank.")
        if isinstance(value, list) and any(isinstance(item, str) and not item.strip() for item in value):
            raise ValueError("Knowledge labels cannot be blank.")
        return value


class ExtractedConcept(KnowledgeModel):
    name: str = Field(min_length=1, max_length=100)
    definition: str = Field(min_length=1, max_length=500)
    aliases: list[str] = Field(max_length=6)
    keywords: list[str] = Field(max_length=6)
    topic: str = Field(min_length=1, max_length=100)
    topic_aliases: list[str] = Field(max_length=4)

    @field_validator("aliases", "keywords", "topic_aliases")
    @classmethod
    def clean_labels(cls, labels):
        if any(len(label) > 100 for label in labels):
            raise ValueError("Knowledge labels are too long.")
        return list(dict.fromkeys(label.strip() for label in labels))


class ExtractedRelation(KnowledgeModel):
    source: str = Field(min_length=1, max_length=100)
    target: str = Field(min_length=1, max_length=100)
    relation_type: RelationType
    reason: str = Field(min_length=1, max_length=350)
    evidence: str = Field(min_length=8, max_length=600)


class LearningTopic(KnowledgeModel):
    name: str = Field(min_length=1, max_length=100)
    aliases: list[str] = Field(max_length=4)

    @field_validator("aliases")
    @classmethod
    def clean_aliases(cls, aliases):
        if any(len(alias) > 100 for alias in aliases):
            raise ValueError("Topic aliases are too long.")
        return list(dict.fromkeys(alias.strip() for alias in aliases))


class KnowledgeExtraction(KnowledgeModel):
    concepts: list[ExtractedConcept] = Field(max_length=3)
    relations: list[ExtractedRelation] = Field(max_length=5)
    outcome: Literal["extracted", "non_learning"]

    @model_validator(mode="after")
    def validate_outcome(self):
        if self.outcome == "non_learning":
            if self.concepts or self.relations:
                raise ValueError("Small talk must not create graph data.")
        elif not self.concepts:
            raise ValueError("A learning extraction requires 1-3 concepts.")
        keys = [name_key(concept.name) for concept in self.concepts]
        if len(keys) != len(set(keys)):
            raise ValueError("An extraction cannot repeat a concept name.")
        return self


class MatchDecision(KnowledgeModel):
    verdict: Literal["same", "different", "uncertain"]
    candidate_index: int = Field(ge=-1, le=2)

    @model_validator(mode="after")
    def validate_candidate(self, info: ValidationInfo):
        count = (info.context or {}).get("candidate_count", 0)
        if self.verdict == "same":
            if not 0 <= self.candidate_index < count:
                raise ValueError("The matched candidate must exist.")
        elif self.candidate_index != -1:
            raise ValueError("Non-matches must use candidate_index -1.")
        return self
